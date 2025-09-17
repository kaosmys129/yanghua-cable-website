# Strapi Cloud Integration Guide

## Overview

This document outlines the complete integration of Strapi Cloud with the Yanghua B2B website frontend. The integration includes optimized data fetching, error handling, caching strategies, and network resilience specifically designed for cloud services.

## Configuration

### Environment Variables

```bash
# .env.local
STRAPI_BASE_URL=https://fruitful-presence-02d7be759c.strapiapp.com
# STRAPI_API_TOKEN=your_api_token_here   # API Token not required for public articles endpoint
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development
```

### Key Features

1. **Public API Access**: Articles endpoint is publicly accessible without API token
2. **HTTPS Communication**: Secure communication with Strapi Cloud
3. **Enhanced Error Handling**: Cloud-specific error handling and user-friendly messages
4. **Intelligent Retry Logic**: Exponential backoff with network-aware retry strategies
5. **Optimized Caching**: Extended cache times for better cloud service performance

## Implementation Details

### 1. Strapi Client Configuration (`src/lib/strapi-client.ts`)

#### Enhanced Features:
- **Timeout Configuration**: 30-second timeout for cloud requests
- **Retry Logic**: Smart retry for network errors, timeouts, and server errors
- **Error Classification**: Distinguishes between retryable and non-retryable errors
- **Logging**: Comprehensive logging for monitoring and debugging

#### Retry Strategy:
```typescript
const RETRY_CONFIG = {
  maxRetries: 5,        // Increased for cloud reliability
  retryDelay: 2000,     // 2 second initial delay
  backoffMultiplier: 2, // Exponential backoff
  timeout: 30000        // 30 second timeout
};
```

#### Error Handling:
- **Network Errors**: DNS issues, connection resets, timeouts
- **Server Errors**: 5xx status codes with appropriate retry
- **Rate Limiting**: 429 status code handling
- **User-Friendly Messages**: Translated technical errors to user-friendly messages

### 2. React Query Configuration (`src/lib/queries.ts`)

#### Optimized Settings:
- **Articles List**: 10-minute stale time, 30-minute garbage collection
- **Individual Articles**: 15-minute stale time, 1-hour garbage collection
- **Custom Retry Logic**: Avoids retrying 404 errors
- **Network Awareness**: Only runs queries when online

#### Cache Strategy:
```typescript
// Articles list - frequently accessed
staleTime: 10 * 60 * 1000,  // 10 minutes
gcTime: 30 * 60 * 1000,     // 30 minutes

// Individual articles - less frequently updated
staleTime: 15 * 60 * 1000,  // 15 minutes
gcTime: 60 * 60 * 1000,     // 1 hour
```

### 3. Global Query Client (`src/components/providers/QueryProvider.tsx`)

#### Enhanced Configuration:
- **Network Mode**: Only runs queries when online
- **Reconnection Handling**: Automatically refetches on reconnection
- **Mutation Retry**: Limited retries for mutations with exponential backoff
- **Error Boundaries**: Integrated error handling

## Testing

### Test Page (`/test-cloud`)

A dedicated test page is available at `/test-cloud` to verify:
- Strapi Cloud connection status
- Data fetching functionality
- Error handling behavior
- Network resilience

### Manual Testing Checklist

- [ ] Articles load successfully from Strapi Cloud
- [ ] Error messages are user-friendly
- [ ] Retry mechanism works for network issues
- [ ] Cache invalidation works correctly
- [ ] Offline/online state handling
- [ ] Performance is acceptable with cloud latency

### Browser Console Monitoring

The integration includes detailed console logging:
- API request URLs and timing
- Retry attempts with delay information
- Error details with context
- Cache hit/miss information

## Performance Optimizations

### 1. Caching Strategy
- **Extended Stale Times**: Reduced API calls to cloud service
- **Intelligent Garbage Collection**: Memory-efficient cache management
- **Background Refetching**: Updates data without blocking UI

### 2. Network Resilience
- **Connection Monitoring**: Detects online/offline state
- **Automatic Retry**: Handles temporary network issues
- **Graceful Degradation**: Continues working with cached data

### 3. Error Recovery
- **Exponential Backoff**: Prevents overwhelming the server
- **Circuit Breaker Pattern**: Stops retrying after repeated failures
- **Fallback Mechanisms**: Shows cached data when possible

## Monitoring and Debugging

### Console Logs
- Request URLs and response times
- Retry attempts and delays
- Error details with stack traces
- Cache operations and hit rates

### Error Tracking
- Network connectivity issues
- API response errors
- Timeout occurrences
- Retry exhaustion

## Best Practices

1. **Monitor Network Performance**: Keep track of response times and error rates
2. **Adjust Cache Times**: Based on content update frequency
3. **Handle Offline States**: Provide meaningful feedback to users
4. **Log Important Events**: For debugging and monitoring
5. **Test Edge Cases**: Network failures, slow connections, server errors

## Troubleshooting

### Common Issues

1. **Slow Loading**: Check network connection and Strapi Cloud status
2. **Failed Requests**: Verify Strapi Cloud URL and endpoint availability
3. **Cache Issues**: Clear browser cache or restart development server
4. **Type Errors**: Ensure Article type definitions match Strapi schema

### Debug Steps

1. Check browser console for detailed error logs
2. Visit `/test-cloud` page to verify connection
3. Verify environment variables are correctly set
4. Test with different network conditions
5. Check Strapi Cloud dashboard for service status

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live content updates
2. **Advanced Caching**: Service worker for offline functionality
3. **Performance Metrics**: Detailed performance monitoring and analytics
4. **A/B Testing**: Different caching strategies based on user behavior
5. **CDN Integration**: Content delivery network for global performance

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready