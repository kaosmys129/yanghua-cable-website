/**
 * Network Debugging Script for Articles List Page
 * 
 * This script helps capture and compare network requests between:
 * 1. Client-side routing (navigating to /articles)
 * 2. Server-side rendering (directly accessing /articles)
 * 
 * Usage:
 * 1. Open browser developer tools
 * 2. Paste this script in the console
 * 3. Follow the instructions
 */

(function() {
  'use strict';
  
  const DEBUG_PREFIX = '[NetworkDebugScript]';
  const capturedRequests = [];
  let isCapturing = false;
  
  // Enhanced network request capture
  function captureNetworkRequests() {
    if (isCapturing) {
      console.log(DEBUG_PREFIX, 'Already capturing requests');
      return;
    }
    
    isCapturing = true;
    capturedRequests.length = 0; // Clear previous requests
    
    console.log(DEBUG_PREFIX, 'Starting network request capture...');
    console.log(DEBUG_PREFIX, 'Current URL:', window.location.href);
    console.log(DEBUG_PREFIX, 'Navigation type:', getNavigationType());
    console.log(DEBUG_PREFIX, 'User Agent:', window.navigator.userAgent);
    
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      const options = args[1] || {};
      const startTime = performance.now();
      
      console.log(DEBUG_PREFIX, 'Fetch request detected:', {
        url: url,
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body
      });
      
      return originalFetch.apply(this, args)
        .then(response => {
          const duration = performance.now() - startTime;
          const requestInfo = {
            type: 'fetch',
            url: url,
            method: options.method || 'GET',
            status: response.status,
            statusText: response.statusText,
            duration: Math.round(duration),
            timestamp: new Date().toISOString(),
            headers: options.headers,
            responseHeaders: Object.fromEntries(response.headers.entries())
          };
          
          capturedRequests.push(requestInfo);
          console.log(DEBUG_PREFIX, 'Fetch response:', requestInfo);
          
          return response;
        })
        .catch(error => {
          const duration = performance.now() - startTime;
          const requestInfo = {
            type: 'fetch',
            url: url,
            method: options.method || 'GET',
            error: error.message,
            duration: Math.round(duration),
            timestamp: new Date().toISOString(),
            headers: options.headers
          };
          
          capturedRequests.push(requestInfo);
          console.error(DEBUG_PREFIX, 'Fetch error:', requestInfo);
          
          throw error;
        });
    };
    
    // Monitor XMLHttpRequest
    const OriginalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      const xhr = new OriginalXMLHttpRequest();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      
      let method = 'GET';
      let url = '';
      let startTime;
      
      xhr.open = function(m, u, ...args) {
        method = m;
        url = u;
        return originalOpen.apply(this, [m, u, ...args]);
      };
      
      xhr.send = function(data) {
        startTime = performance.now();
        
        console.log(DEBUG_PREFIX, 'XMLHttpRequest detected:', {
          url: url,
          method: method,
          data: data
        });
        
        const originalOnReadyStateChange = xhr.onreadystatechange;
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            const duration = performance.now() - startTime;
            const requestInfo = {
              type: 'xhr',
              url: url,
              method: method,
              status: xhr.status,
              statusText: xhr.statusText,
              duration: Math.round(duration),
              timestamp: new Date().toISOString(),
              responseHeaders: xhr.getAllResponseHeaders()
            };
            
            if (xhr.status >= 200 && xhr.status < 300) {
              capturedRequests.push(requestInfo);
              console.log(DEBUG_PREFIX, 'XMLHttpRequest completed:', requestInfo);
            } else {
              capturedRequests.push(requestInfo);
              console.error(DEBUG_PREFIX, 'XMLHttpRequest failed:', requestInfo);
            }
          }
          
          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.apply(this, arguments);
          }
        };
        
        return originalSend.apply(this, arguments);
      };
      
      return xhr;
    };
    
    console.log(DEBUG_PREFIX, 'Network request capture started');
  }
  
  function getNavigationType() {
    if (!window.performance || !window.performance.navigation) {
      return 'unknown';
    }
    
    const types = {
      0: 'navigate',
      1: 'reload', 
      2: 'back_forward'
    };
    
    return types[window.performance.navigation.type] || 'unknown';
  }
  
  function analyzeStrapiRequests() {
    const strapiRequests = capturedRequests.filter(req => 
      req.url && (req.url.includes('strapi') || req.url.includes('articles'))
    );
    
    console.log(DEBUG_PREFIX, 'Strapi-related requests:', strapiRequests);
    return strapiRequests;
  }
  
  function compareRequests(clientRequests, serverRequests) {
    console.log(DEBUG_PREFIX, 'Comparing client vs server requests...');
    
    const comparison = {
      client: clientRequests,
      server: serverRequests,
      differences: []
    };
    
    // Compare URLs
    const clientUrls = clientRequests.map(req => req.url);
    const serverUrls = serverRequests.map(req => req.url);
    
    const uniqueClientUrls = clientUrls.filter(url => !serverUrls.includes(url));
    const uniqueServerUrls = serverUrls.filter(url => !clientUrls.includes(url));
    
    if (uniqueClientUrls.length > 0) {
      comparison.differences.push({
        type: 'url',
        issue: 'Client-only URLs',
        details: uniqueClientUrls
      });
    }
    
    if (uniqueServerUrls.length > 0) {
      comparison.differences.push({
        type: 'url',
        issue: 'Server-only URLs',
        details: uniqueServerUrls
      });
    }
    
    // Compare request methods
    clientRequests.forEach((clientReq, index) => {
      const serverReq = serverRequests[index];
      if (serverReq) {
        if (clientReq.method !== serverReq.method) {
          comparison.differences.push({
            type: 'method',
            issue: `Method mismatch for ${clientReq.url}`,
            client: clientReq.method,
            server: serverReq.method
          });
        }
        
        if (clientReq.status !== serverReq.status) {
          comparison.differences.push({
            type: 'status',
            issue: `Status mismatch for ${clientReq.url}`,
            client: clientReq.status,
            server: serverReq.status
          });
        }
        
        if (Math.abs(clientReq.duration - serverReq.duration) > 1000) {
          comparison.differences.push({
            type: 'duration',
            issue: `Significant duration difference for ${clientReq.url}`,
            client: `${clientReq.duration}ms`,
            server: `${serverReq.duration}ms`
          });
        }
      }
    });
    
    console.log(DEBUG_PREFIX, 'Comparison result:', comparison);
    return comparison;
  }
  
  function exportResults() {
    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        userAgent: window.navigator.userAgent,
        navigationType: getNavigationType(),
        currentUrl: window.location.href,
        referrer: document.referrer
      },
      allRequests: capturedRequests,
      strapiRequests: analyzeStrapiRequests(),
      performanceEntries: getPerformanceEntries()
    };
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(DEBUG_PREFIX, 'Results exported');
  }
  
  function getPerformanceEntries() {
    if (!window.performance || !window.performance.getEntries) {
      return [];
    }
    
    const entries = window.performance.getEntries();
    return entries
      .filter(entry => entry.name && (entry.name.includes('strapi') || entry.name.includes('articles')))
      .map(entry => ({
        name: entry.name,
        entryType: entry.entryType,
        startTime: entry.startTime,
        duration: entry.duration,
        responseStatus: entry.responseStatus,
        responseEnd: entry.responseEnd,
        requestStart: entry.requestStart
      }));
  }
  
  function showHelp() {
    console.log(`
${DEBUG_PREFIX} Network Debugging Script - Help
=====================================

Available Commands:
--------------------
1. startCapture() - Start capturing network requests
2. stopCapture() - Stop capturing network requests  
3. showCaptured() - Display all captured requests
4. analyzeStrapi() - Analyze Strapi-related requests
5. exportResults() - Export all captured data as JSON
6. compareScenarios(clientData, serverData) - Compare client vs server scenarios
7. showHelp() - Show this help message

Usage Instructions:
------------------
1. Test Client-Side Routing:
   - Navigate to homepage first
   - Run: startCapture()
   - Navigate to /articles page via link/SPA navigation
   - Run: stopCapture()
   - Run: exportResults() to save client routing data

2. Test Server-Side Rendering:
   - Open new tab and go to homepage
   - Run: startCapture()
   - Directly enter /articles in address bar
   - Run: stopCapture()
   - Run: exportResults() to save server rendering data

3. Compare Results:
   - Load both exported JSON files
   - Run: compareScenarios(clientData, serverData)

Tips:
-----
- Check browser console for real-time request logs
- Look for differences in URLs, headers, timing, and status codes
- Pay attention to Strapi Cloud cold-start delays
- Monitor for any authentication or CORS issues
    `);
  }
  
  // Expose functions globally
  window.NetworkDebugger = {
    startCapture: captureNetworkRequests,
    stopCapture: function() {
      isCapturing = false;
      console.log(DEBUG_PREFIX, 'Network request capture stopped');
      console.log(DEBUG_PREFIX, 'Total requests captured:', capturedRequests.length);
    },
    showCaptured: function() {
      console.log(DEBUG_PREFIX, 'All captured requests:', capturedRequests);
      return capturedRequests;
    },
    analyzeStrapi: analyzeStrapiRequests,
    exportResults: exportResults,
    compareScenarios: compareRequests,
    showHelp: showHelp,
    getPerformanceEntries: getPerformanceEntries
  };
  
  console.log(DEBUG_PREFIX, 'Network debugging script loaded successfully!');
  console.log(DEBUG_PREFIX, 'Type NetworkDebugger.showHelp() for usage instructions');
  
})();