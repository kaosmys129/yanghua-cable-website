'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { startNetworkDebugging, getNetworkRequests, compareNetworkScenarios, clearNetworkRequests } from '@/lib/network-debug';

interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  timestamp: number;
  duration?: number;
  error?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
}

interface ScenarioComparison {
  clientRouting: NetworkRequest[];
  serverRendering: NetworkRequest[];
  differences: {
    url: string;
    clientStatus?: number;
    serverStatus?: number;
    clientDuration?: number;
    serverDuration?: number;
    difference: string;
  }[];
}

export default function NetworkTestPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    clientRouting: NetworkRequest[];
    serverRendering: NetworkRequest[];
    comparison: ScenarioComparison | null;
  }>({ clientRouting: [], serverRendering: [], comparison: null });
  const [currentScenario, setCurrentScenario] = useState<'idle' | 'client' | 'server'>('idle');
  const [environmentInfo, setEnvironmentInfo] = useState<{
    userAgent: string;
    navigationType: number;
    referrer: string;
    currentUrl: string;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    console.log('[NetworkTest] Component mounted, initializing network debugging...');
    
    // Check if we have a pending test scenario from previous page load
    const pendingScenario = sessionStorage.getItem('networkTestScenario');
    const testStartTime = sessionStorage.getItem('networkTestStartTime');
    const autoCapture = sessionStorage.getItem('networkTestAutoCapture');
    
    if (pendingScenario && testStartTime && autoCapture === 'true') {
      console.log(`[NetworkTest] Found pending test scenario: ${pendingScenario}`);
      
      // Clear the pending scenario
      sessionStorage.removeItem('networkTestScenario');
      sessionStorage.removeItem('networkTestStartTime');
      sessionStorage.removeItem('networkTestAutoCapture');
      
      // Auto-capture requests for the pending scenario
      setTimeout(() => {
        console.log(`[NetworkTest] Auto-capturing requests for scenario: ${pendingScenario}`);
        
        if (pendingScenario === 'server') {
          const requests = getNetworkRequests();
          console.log(`[NetworkTest] Captured ${requests.length} server rendering requests`);
          
          // Transform requests to match the expected format
          const transformedRequests = requests.map(req => {
            // Handle both formats: direct request or {request, response} object
            return req.request || req;
          });
          
          setTestResults(prev => ({
            ...prev,
            serverRendering: transformedRequests
          }));
          
          // Show completion message
          alert(`Server Rendering Test Complete!\n\nCaptured ${transformedRequests.length} network requests.\n\nYou can now run the comparison to analyze the results.`);
        }
      }, 2000); // Give more time for page to fully load
    }
    
    // Initialize network debugging
    startNetworkDebugging();
    
    // Capture environment information
    setEnvironmentInfo({
      userAgent: window.navigator.userAgent,
      navigationType: window.performance?.navigation?.type || 0,
      referrer: document.referrer,
      currentUrl: window.location.href,
      timestamp: Date.now()
    });

    console.log('[NetworkTest] Debug page loaded');
    console.log('[NetworkTest] Navigation type:', window.performance?.navigation?.type);
    console.log('[NetworkTest] Current URL:', window.location.href);
    console.log('[NetworkTest] Referrer:', document.referrer);

    return () => {
      // Cleanup
      clearNetworkRequests();
    };
  }, []);

  const runClientRoutingTest = async () => {
    setIsTesting(true);
    setCurrentScenario('client');
    clearNetworkRequests();
    
    console.log('[NetworkTest] Starting client routing test...');
    
    // Navigate to a different page first, then back to articles
    router.push(`/${locale}/`);
    
    setTimeout(() => {
      console.log('[NetworkTest] Navigating to articles page (client routing)...');
      router.push(`/${locale}/articles`);
      
      // Capture requests after navigation
      setTimeout(() => {
        const requests = getNetworkRequests();
        console.log('[NetworkTest] Client routing requests captured:', requests);
        
        // Extract the actual NetworkRequest objects from the captured data
        const networkRequests = requests.map(req => 
          req.request || req // Handle both formats: direct request or {request, response} object
        );
        
        setTestResults(prev => ({
          ...prev,
          clientRouting: networkRequests
        }));
        
        setCurrentScenario('idle');
        setIsTesting(false);
      }, 2000);
    }, 1000);
  };

  const runServerRenderingTest = async () => {
    setIsTesting(true);
    setCurrentScenario('server');
    clearNetworkRequests();
    
    console.log('[NetworkTest] Starting server rendering test...');
    console.log('[NetworkTest] Preparing for server-side rendering test...');
    
    // Store test configuration for the next page load
    sessionStorage.setItem('networkTestScenario', 'server');
    sessionStorage.setItem('networkTestStartTime', Date.now().toString());
    sessionStorage.setItem('networkTestAutoCapture', 'true');
    
    // Show instructions to user
    alert('Server Rendering Test\n\nPlease manually refresh this page (F5 or Cmd+R) to test server-side rendering.\n\nThe test will automatically capture network requests after the refresh.');
    
    setIsTesting(false);
    setCurrentScenario('idle');
  };

  const compareResults = () => {
    const comparison = compareNetworkScenarios();
    
    // Transform the comparison result to match the expected type
    const transformedComparison: ScenarioComparison = {
      clientRouting: comparison.clientRequests?.map(req => req.request || req) || [],
      serverRendering: comparison.serverRequests?.map(req => req.request || req) || [],
      differences: [] // Don't include differences as they have different format
    };
    
    setTestResults(prev => ({
      ...prev,
      comparison: transformedComparison
    }));
  };

  const clearResults = () => {
    clearNetworkRequests();
    setTestResults({ clientRouting: [], serverRendering: [], comparison: null });
    setCurrentScenario('idle');
  };

  const exportResults = () => {
    const results = {
      timestamp: new Date().toISOString(),
      environment: environmentInfo,
      clientRouting: testResults.clientRouting,
      serverRendering: testResults.serverRendering,
      comparison: testResults.comparison,
      currentLocale: locale
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-test-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Network Request Debugging Tool</h1>
        
        {/* Environment Information */}
        {environmentInfo && (
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-2">Environment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Navigation Type:</strong> {environmentInfo.navigationType} 
                ({environmentInfo.navigationType === 0 ? 'Navigate' : 
                  environmentInfo.navigationType === 1 ? 'Reload' : 
                  environmentInfo.navigationType === 2 ? 'Back/Forward' : 'Unknown'})
              </div>
              <div><strong>Current URL:</strong> {environmentInfo.currentUrl}</div>
              <div><strong>Referrer:</strong> {environmentInfo.referrer || 'None'}</div>
              <div><strong>User Agent:</strong> {environmentInfo.userAgent}</div>
            </div>
          </div>
        )}

        {/* Test Controls */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={runClientRoutingTest}
              disabled={isTesting}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              {isTesting && currentScenario === 'client' ? 'Testing...' : 'Test Client Routing'}
            </button>
            <button
              onClick={runServerRenderingTest}
              disabled={isTesting}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              {isTesting && currentScenario === 'server' ? 'Testing...' : 'Test Server Rendering'}
            </button>
            <button
              onClick={compareResults}
              disabled={testResults.clientRouting.length === 0 || testResults.serverRendering.length === 0}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              Compare Results
            </button>
            <button
              onClick={clearResults}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              Clear Results
            </button>
            <button
              onClick={exportResults}
              disabled={testResults.clientRouting.length === 0 && testResults.serverRendering.length === 0}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
            >
              Export Results
            </button>
          </div>
          
          {isTesting && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              <p className="font-medium">Test in progress...</p>
              <p className="text-sm">
                {currentScenario === 'client' 
                  ? 'Testing client-side routing. Navigating to articles page...'
                  : 'Testing server-side rendering. Force reloading page...'}
              </p>
            </div>
          )}
        </div>

        {/* Current Network Requests */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Network Requests</h2>
          <div className="space-y-2">
            {getNetworkRequests().length === 0 ? (
              <p className="text-gray-500">No network requests captured yet.</p>
            ) : (
              getNetworkRequests().map((request, index) => {
                // Handle both formats: direct request or {request, response} object
                const actualRequest = request.request || request;
                const response = request.response;
                
                return (
                  <div key={index} className="border border-gray-200 p-3 rounded text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>URL:</strong> {actualRequest.url}<br/>
                        <strong>Method:</strong> {actualRequest.method}<br/>
                        <strong>Status:</strong> {response?.status || 'Pending'}<br/>
                        <strong>Timestamp:</strong> {new Date(actualRequest.timestamp).toLocaleTimeString()}
                      </div>
                      {response?.responseTime && (
                        <div className="text-right">
                          <strong>Duration:</strong> {response.responseTime}ms
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Test Results */}
        {testResults.clientRouting.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Client Routing Results</h2>
            <div className="space-y-2">
              {testResults.clientRouting.map((request, index) => {
                // Client routing requests are already in the correct format
                const actualRequest = request;
                
                return (
                  <div key={index} className="border border-blue-200 p-3 rounded bg-blue-50 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>URL:</strong> {actualRequest.url}<br/>
                        <strong>Method:</strong> {actualRequest.method}<br/>
                        <strong>Status:</strong> {actualRequest.status || 'Unknown'}<br/>
                        <strong>Timestamp:</strong> {new Date(actualRequest.timestamp).toLocaleTimeString()}
                      </div>
                      {actualRequest.duration && (
                        <div className="text-right">
                          <strong>Duration:</strong> {actualRequest.duration}ms
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {testResults.serverRendering.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Server Rendering Results</h2>
            <div className="space-y-2">
              {testResults.serverRendering.map((request, index) => {
                // Server rendering requests are already in the correct format
                const actualRequest = request;
                
                return (
                  <div key={index} className="border border-green-200 p-3 rounded bg-green-50 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong>URL:</strong> {actualRequest.url}<br/>
                        <strong>Method:</strong> {actualRequest.method}<br/>
                        <strong>Status:</strong> {actualRequest.status || 'Unknown'}<br/>
                        <strong>Timestamp:</strong> {new Date(actualRequest.timestamp).toLocaleTimeString()}
                      </div>
                      {actualRequest.duration && (
                        <div className="text-right">
                          <strong>Duration:</strong> {actualRequest.duration}ms
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Comparison Results */}
        {testResults.comparison && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Comparison Results</h2>
                <div className="space-y-4">
                  {testResults.comparison.clientRouting.map((clientReq, index) => {
                    const serverReq = testResults.comparison!.serverRendering[index];
                    const differences = [];
                    
                    // Calculate differences
                    if (clientReq && serverReq) {
                      if (clientReq.url !== serverReq.url) {
                        differences.push(`URL mismatch: ${clientReq.url} vs ${serverReq.url}`);
                      }
                      if (clientReq.method !== serverReq.method) {
                        differences.push(`Method mismatch: ${clientReq.method} vs ${serverReq.method}`);
                      }
                      if (clientReq.status !== serverReq.status) {
                        differences.push(`Status mismatch: ${clientReq.status} vs ${serverReq.status}`);
                      }
                    }
                    
                    return (
                  <div key={index} className="border border-purple-200 p-4 rounded bg-purple-50">
                    <h3 className="font-semibold mb-2">Request #{index + 1}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-blue-600 mb-1">Client Routing</h4>
                        <div className="text-sm">
                          <strong>URL:</strong> {clientReq?.url || 'N/A'}<br/>
                          <strong>Method:</strong> {clientReq?.method || 'N/A'}<br/>
                          <strong>Status:</strong> {clientReq?.status || 'Unknown'}<br/>
                          <strong>Duration:</strong> {clientReq?.duration || 'Unknown'}ms
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-600 mb-1">Server Rendering</h4>
                        <div className="text-sm">
                          <strong>URL:</strong> {serverReq?.url || 'N/A'}<br/>
                          <strong>Method:</strong> {serverReq?.method || 'N/A'}<br/>
                          <strong>Status:</strong> {serverReq?.status || 'Unknown'}<br/>
                          <strong>Duration:</strong> {serverReq?.duration || 'Unknown'}ms
                        </div>
                      </div>
                    </div>
                    {differences.length > 0 && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <h4 className="font-medium text-yellow-800 mb-1">Differences Found:</h4>
                        <ul className="text-sm text-yellow-700">
                          {differences.map((diff, diffIndex) => (
                            <li key={diffIndex}>{diff}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}