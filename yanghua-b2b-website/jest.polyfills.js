// Polyfill for TextEncoder/TextDecoder
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill for crypto
const { webcrypto } = require('crypto');
global.crypto = webcrypto;

// Polyfill for URL
const { URL, URLSearchParams } = require('url');
global.URL = URL;
global.URLSearchParams = URLSearchParams;

// Polyfill for AbortController
const { AbortController, AbortSignal } = require('abort-controller');
global.AbortController = AbortController;
global.AbortSignal = AbortSignal;

// Polyfill for structuredClone
global.structuredClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};