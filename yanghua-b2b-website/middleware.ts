// Proxy to src/middleware to avoid duplication.
// This file exists only to delegate to the canonical implementation in src/middleware.ts.
// If possible, remove this file entirely in production.
export { default } from './src/middleware';
export { config } from './src/middleware';