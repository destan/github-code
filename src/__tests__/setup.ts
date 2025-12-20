import { beforeEach, vi } from 'vitest';

// Mock CSS imports (since esbuild plugin won't run in tests)
vi.mock('../styles/base-light.css', () => ({
  default: ':host { display: block; }',
}));

vi.mock('../styles/base-dark.css', () => ({
  default: ':host { display: block; }',
}));

vi.mock('../styles/tab.css', () => ({
  default: 'nav { display: flex; }',
}));

// Mock fetch globally
global.fetch = vi.fn();

// Mock requestIdleCallback (not in all environments)
if (!('requestIdleCallback' in global)) {
  (global as any).requestIdleCallback = (callback: IdleRequestCallback) => {
    return setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 50 }), 0) as unknown as number;
  };

  (global as any).cancelIdleCallback = (id: number) => {
    clearTimeout(id);
  };
}

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();

  if ((global as any).window?.hljs) {
    delete (global as any).window.hljs;
  }
});
