'use client';

import React, { useState, useEffect } from 'react';
import { Bug, X, Download, Trash2, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import errorLogger, { ErrorLogEntry } from '../../lib/error-logger';

interface DebugPanelProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export default function DebugPanel({ isVisible = false, onToggle }: DebugPanelProps) {
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'error' | 'warn' | 'info'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Update logs every second
    const interval = setInterval(() => {
      setLogs(errorLogger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = selectedLevel === 'all' 
    ? logs 
    : logs.filter(log => log.level === selectedLevel);

  const handleDownloadLogs = () => {
    const dataStr = errorLogger.exportLogs();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    errorLogger.clearLogs();
    setLogs([]);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warn':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!isVisible && process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Debug Toggle Button */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          title="Toggle Debug Panel"
        >
          <Bug className="h-5 w-5" />
        </button>
      )}

      {/* Debug Panel */}
      {isExpanded && (
        <div className="fixed bottom-20 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-40 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
            <div className="flex items-center">
              <Bug className="h-5 w-5 mr-2" />
              <span className="font-medium">Debug Panel</span>
              <span className="ml-2 bg-gray-600 px-2 py-1 rounded text-xs">
                {filteredLogs.length} logs
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Levels</option>
                <option value="error">Errors</option>
                <option value="warn">Warnings</option>
                <option value="info">Info</option>
              </select>
              <div className="flex space-x-2">
                <button
                  onClick={handleDownloadLogs}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 flex items-center"
                  title="Download Logs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </button>
                <button
                  onClick={handleClearLogs}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 flex items-center"
                  title="Clear Logs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className="max-h-64 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No logs to display
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredLogs.slice(-20).reverse().map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded border text-xs ${getLevelColor(log.level)}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center">
                        {getLevelIcon(log.level)}
                        <span className="ml-1 font-medium uppercase">
                          {log.level}
                        </span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-gray-800 mb-1">{log.message}</div>
                    {log.context && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Context
                        </summary>
                        <pre className="mt-1 text-xs bg-white p-1 rounded border overflow-auto max-h-20">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </details>
                    )}
                    {log.stack && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Stack Trace
                        </summary>
                        <pre className="mt-1 text-xs bg-white p-1 rounded border overflow-auto max-h-20 whitespace-pre-wrap">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System Info */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
            <div className="grid grid-cols-2 gap-2">
              <div>URL: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</div>
              <div>Language: English (en)</div>
              <div>Errors: {logs.filter(l => l.level === 'error').length}</div>
              <div>Warnings: {logs.filter(l => l.level === 'warn').length}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};