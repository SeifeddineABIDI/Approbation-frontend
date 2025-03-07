// Polyfill for 'global' to support libraries expecting Node.js environment
(window as any).global = window;