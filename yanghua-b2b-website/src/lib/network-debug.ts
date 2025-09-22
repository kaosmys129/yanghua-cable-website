/**
 * Network Request Debug Utility
 * 
 * This utility helps capture and compare actual network requests
 * between client-side routing and server-side rendering scenarios.
 */

interface NetworkRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  timestamp: number;
  userAgent: string;
  locale: string;
  scenario: 'client-route' | 'server-render' | 'direct-access';
}

interface NetworkResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  dataSize: number;
  responseTime: number;
}

export class NetworkRequestDebugger {
  private static instance: NetworkRequestDebugger;
  private requests: Map<string, { request: NetworkRequest; response?: NetworkResponse }> = new Map();
  private originalFetch: typeof fetch;
  private isIntercepting = false;

  private constructor() {
    this.originalFetch = globalThis.fetch;
  }

  static getInstance(): NetworkRequestDebugger {
    if (!NetworkRequestDebugger.instance) {
      NetworkRequestDebugger.instance = new NetworkRequestDebugger();
    }
    return NetworkRequestDebugger.instance;
  }

  /**
   * Start intercepting network requests
   */
  startIntercepting() {
    if (this.isIntercepting) return;
    
    this.isIntercepting = true;
    const networkDebugger = this;

    // Override global fetch to capture requests
    globalThis.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const startTime = Date.now();
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      
      // Determine scenario
      const scenario = networkDebugger.determineScenario();
      
      // Create request info
      const requestInfo: NetworkRequest = {
        url,
        method: init?.method || 'GET',
        headers: networkDebugger.extractHeaders(init?.headers),
        timestamp: startTime,
        userAgent: globalThis.navigator?.userAgent || 'server',
        locale: networkDebugger.getCurrentLocale(),
        scenario
      };

      const requestId = `${scenario}-${startTime}-${Math.random().toString(36).substr(2, 9)}`;
      networkDebugger.requests.set(requestId, { request: requestInfo });

      console.log(`[NetworkDebugger] ${scenario} request:`, {
        url,
        method: requestInfo.method,
        locale: requestInfo.locale,
        timestamp: new Date(startTime).toISOString()
      });

      try {
        // Make the actual request - bind to correct context
        const response = await networkDebugger.originalFetch.call(globalThis, input, init);
        const endTime = Date.now();

        // Capture response info
        const responseInfo: NetworkResponse = {
          status: response.status,
          statusText: response.statusText,
          headers: networkDebugger.extractHeaders(response.headers),
          dataSize: 0, // Will be updated if needed
          responseTime: endTime - startTime
        };

        // Clone response to read body without consuming original
        const clonedResponse = response.clone();
        try {
          const text = await clonedResponse.text();
          responseInfo.dataSize = text.length;
        } catch (e) {
          // Ignore errors reading response body
        }

        networkDebugger.requests.set(requestId, { 
          request: requestInfo, 
          response: responseInfo 
        });

        console.log(`[NetworkDebugger] ${scenario} response:`, {
          url,
          status: responseInfo.status,
          responseTime: responseInfo.responseTime + 'ms',
          dataSize: responseInfo.dataSize + ' bytes'
        });

        return response;
      } catch (error) {
        const endTime = Date.now();
        console.error(`[NetworkDebugger] ${scenario} error:`, {
          url,
          error: error instanceof Error ? error.message : String(error),
          responseTime: (endTime - startTime) + 'ms'
        });
        throw error;
      }
    };
  }

  /**
   * Stop intercepting network requests
   */
  stopIntercepting() {
    if (!this.isIntercepting) return;
    
    globalThis.fetch = this.originalFetch;
    this.isIntercepting = false;
  }

  /**
   * Get all captured requests
   */
  getRequests(scenario?: NetworkRequest['scenario']) {
    const allRequests = Array.from(this.requests.values());
    return scenario ? allRequests.filter(req => req.request.scenario === scenario) : allRequests;
  }

  /**
   * Compare requests between different scenarios
   */
  compareScenarios(): { 
    differences: string[]; 
    similarities: string[];
    clientRequests: Array<{ request: NetworkRequest; response?: NetworkResponse }>;
    serverRequests: Array<{ request: NetworkRequest; response?: NetworkResponse }>;
    directAccessRequests: Array<{ request: NetworkRequest; response?: NetworkResponse }>;
  } {
    const clientRequests = this.getRequests('client-route');
    const serverRequests = this.getRequests('server-render');
    const directAccessRequests = this.getRequests('direct-access');

    const differences: string[] = [];
    const similarities: string[] = [];

    // Compare URLs
    const getUrlPathname = (url: string) => {
      try {
        return url ? new URL(url).pathname : '';
      } catch {
        return url || '';
      }
    };
    
    const clientUrls = clientRequests.map(req => getUrlPathname(req.request.url));
    const serverUrls = serverRequests.map(req => getUrlPathname(req.request.url));
    const directUrls = directAccessRequests.map(req => getUrlPathname(req.request.url));

    // Check for common API endpoints
    const apiEndpoints = ['/api/articles', '/api/health'];
    apiEndpoints.forEach(endpoint => {
      const clientHas = clientUrls.some(url => url.includes(endpoint));
      const serverHas = serverUrls.some(url => url.includes(endpoint));
      const directHas = directUrls.some(url => url.includes(endpoint));

      if (clientHas && serverHas && directHas) {
        similarities.push(`All scenarios call ${endpoint}`);
      } else {
        if (clientHas !== serverHas) {
          differences.push(`Client-route ${clientHas ? 'calls' : 'does not call'} ${endpoint}, server-render ${serverHas ? 'calls' : 'does not call'} ${endpoint}`);
        }
        if (clientHas !== directHas) {
          differences.push(`Client-route ${clientHas ? 'calls' : 'does not call'} ${endpoint}, direct-access ${directHas ? 'calls' : 'does not call'} ${endpoint}`);
        }
      }
    });

    // Compare response times
    if (clientRequests.length > 0 && serverRequests.length > 0) {
      const avgClientTime = clientRequests.reduce((sum, req) => sum + (req.response?.responseTime || 0), 0) / clientRequests.length;
      const avgServerTime = serverRequests.reduce((sum, req) => sum + (req.response?.responseTime || 0), 0) / serverRequests.length;
      
      if (Math.abs(avgClientTime - avgServerTime) > 100) { // 100ms threshold
        differences.push(`Average response time differs: Client ${avgClientTime.toFixed(0)}ms vs Server ${avgServerTime.toFixed(0)}ms`);
      } else {
        similarities.push(`Similar response times: Client ${avgClientTime.toFixed(0)}ms vs Server ${avgServerTime.toFixed(0)}ms`);
      }
    }

    // Compare headers
    if (clientRequests.length > 0 && serverRequests.length > 0) {
      const clientHeaders = clientRequests[0].request.headers;
      const serverHeaders = serverRequests[0].request.headers;
      
      const clientAuth = clientHeaders['authorization'] || clientHeaders['Authorization'];
      const serverAuth = serverHeaders['authorization'] || serverHeaders['Authorization'];
      
      if (clientAuth !== serverAuth) {
        differences.push('Authorization headers differ between scenarios');
      } else {
        similarities.push('Same authorization headers');
      }
    }

    return {
      differences,
      similarities,
      clientRequests,
      serverRequests,
      directAccessRequests
    };
  }

  /**
   * Clear captured requests
   */
  clearRequests() {
    this.requests.clear();
  }

  private determineScenario(): NetworkRequest['scenario'] {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return 'server-render';
    }

    // Check navigation type to determine if this is a client route
    if (window.performance && window.performance.navigation) {
      const navigationType = window.performance.navigation.type;
      if (navigationType === window.performance.navigation.TYPE_NAVIGATE) {
        // This could be either client route or direct access
        // We'll use a heuristic: if there's a referrer from the same origin, it's likely a client route
        const referrer = document.referrer;
        const currentOrigin = window.location.origin;
        
        if (referrer && referrer.startsWith(currentOrigin)) {
          return 'client-route';
        }
        return 'direct-access';
      }
    }

    // Default to client-route if we can't determine
    return 'client-route';
  }

  private getCurrentLocale(): string {
    try {
      // Try to get locale from URL path
      const pathMatch = window.location.pathname.match(/^\/([^\/]+)/);
      if (pathMatch) {
        return pathMatch[1];
      }
      
      // Try to get from Next.js router if available
      if ((window as any).next?.router?.query?.locale) {
        return (window as any).next.router.query.locale;
      }
      
      return 'en'; // default
    } catch {
      return 'en'; // fallback
    }
  }

  private extractHeaders(headers?: HeadersInit): Record<string, string> {
    const result: Record<string, string> = {};
    
    if (!headers) return result;
    
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
    } else if (typeof headers === 'object') {
      Object.assign(result, headers);
    }
    
    return result;
  }
}

// Export singleton instance
export const networkDebugger = NetworkRequestDebugger.getInstance();

// Helper functions for easy debugging
export const startNetworkDebugging = () => networkDebugger.startIntercepting();
export const stopNetworkDebugging = () => networkDebugger.stopIntercepting();
export const getNetworkRequests = (scenario?: NetworkRequest['scenario']) => networkDebugger.getRequests(scenario);
export const compareNetworkScenarios = () => networkDebugger.compareScenarios();
export const clearNetworkRequests = () => networkDebugger.clearRequests();