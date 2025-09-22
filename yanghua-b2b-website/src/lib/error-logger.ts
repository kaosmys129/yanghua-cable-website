// Error logging utility for debugging and monitoring

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
  userId?: string;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createLogEntry(
    level: ErrorLogEntry['level'],
    message: string,
    error?: Error,
    context?: Record<string, any>
  ): ErrorLogEntry {
    // Enhanced stack trace handling
    let stack: string | undefined;
    
    if (error?.stack) {
      stack = error.stack;
    } else if (error && typeof error === 'object') {
      // Try to extract stack from error object properties
      const errorObj = error as any;
      if (errorObj.originalError?.stack) {
        stack = errorObj.originalError.stack;
      } else if (errorObj.cause?.stack) {
        stack = errorObj.cause.stack;
      } else {
        // Generate a basic stack trace if none exists
        try {
          throw new Error('Stack trace generation');
        } catch (e) {
          stack = (e as Error).stack?.split('\n').slice(2).join('\n'); // Remove first 2 lines
        }
      }
    } else if (!error) {
      // Generate stack trace for non-error logs
      try {
        throw new Error('Stack trace generation');
      } catch (e) {
        stack = (e as Error).stack?.split('\n').slice(2).join('\n');
      }
    }
    
    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      stack,
      context: {
        ...context,
        // Add enhanced error context
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        hasOriginalError: !!(context?.originalError),
        detailedErrorInfo: context?.detailedErrorInfo
      },
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  private addLog(entry: ErrorLogEntry) {
    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'info';
      console[consoleMethod](`[${entry.level.toUpperCase()}] ${entry.message}`, {
        timestamp: entry.timestamp,
        stack: entry.stack,
        context: entry.context,
      });
    }

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: ErrorLogEntry) {
    try {
      // Send to our error logging API
      await fetch('/api/logs/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors: [entry] }),
      });
      
      console.log('Error sent to logging service:', entry.id);
    } catch (error) {
      console.error('Failed to send log to external service:', error);
      // Store failed logs for retry
      this.storeFailedLog(entry);
    }
  }

  private storeFailedLog(entry: ErrorLogEntry) {
    try {
      const failedLogs = JSON.parse(localStorage.getItem('failedErrorLogs') || '[]');
      failedLogs.push(entry);
      // Keep only last 50 failed logs
      if (failedLogs.length > 50) {
        failedLogs.splice(0, failedLogs.length - 50);
      }
      localStorage.setItem('failedErrorLogs', JSON.stringify(failedLogs));
    } catch (error) {
      console.error('Failed to store failed log:', error);
    }
  }

  // Retry failed logs
  public async retryFailedLogs() {
    try {
      const failedLogs = JSON.parse(localStorage.getItem('failedErrorLogs') || '[]');
      if (failedLogs.length === 0) return;

      const response = await fetch('/api/logs/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors: failedLogs }),
      });

      if (response.ok) {
        localStorage.removeItem('failedErrorLogs');
        console.log(`Retried ${failedLogs.length} failed logs successfully`);
      }
    } catch (error) {
      console.error('Failed to retry failed logs:', error);
    }
  }

  // Public methods
  error(message: string, error?: Error, context?: Record<string, any>) {
    const entry = this.createLogEntry('error', message, error, context);
    this.addLog(entry);
  }

  warn(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('warn', message, undefined, context);
    this.addLog(entry);
  }

  info(message: string, context?: Record<string, any>) {
    const entry = this.createLogEntry('info', message, undefined, context);
    this.addLog(entry);
  }

  // Get all logs
  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  // Get logs by level
  getLogsByLevel(level: ErrorLogEntry['level']): ErrorLogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Clear all logs
  clearLogs() {
    this.logs = [];
  }

  // Get recent logs (last n entries)
  getRecentLogs(count: number = 10): ErrorLogEntry[] {
    return this.logs.slice(-count);
  }

  // Export logs as JSON for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Log navigation/routing errors specifically
  logNavigationError(path: string, error: Error, context?: Record<string, any>) {
    this.error(`Navigation error for path: ${path}`, error, {
      ...context,
      type: 'navigation',
      path,
    });
  }



  // Log API errors
  logApiError(endpoint: string, method: string, status: number, error?: Error) {
    this.error(`API error: ${method} ${endpoint} (${status})`, error, {
      type: 'api',
      endpoint,
      method,
      status,
    });
  }

  // Log component rendering errors
  logComponentError(componentName: string, error: Error, props?: Record<string, any>) {
    this.error(`Component error in ${componentName}`, error, {
      type: 'component',
      componentName,
      props,
    });
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

// Global error handler for unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorLogger.error('Unhandled error', event.error, {
      type: 'unhandled',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.error('Unhandled promise rejection', event.reason, {
      type: 'unhandled-promise',
    });
  });

  // Retry failed logs on page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      errorLogger.retryFailedLogs();
    }, 2000); // Wait 2 seconds after page load
  });

  // Retry failed logs when coming back online
  window.addEventListener('online', () => {
    errorLogger.retryFailedLogs();
  });
}

export default errorLogger;

// Convenience exports
export const logError = errorLogger.error.bind(errorLogger);
export const logWarn = errorLogger.warn.bind(errorLogger);
export const logInfo = errorLogger.info.bind(errorLogger);
export const logNavigationError = errorLogger.logNavigationError.bind(errorLogger);

export const logApiError = errorLogger.logApiError.bind(errorLogger);
export const logComponentError = errorLogger.logComponentError.bind(errorLogger);