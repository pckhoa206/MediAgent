import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill scrollTo for HTMLDivElement in JSDOM testing environment
if (typeof window !== 'undefined') {
  HTMLDivElement.prototype.scrollTo = vi.fn();
  HTMLDivElement.prototype.scrollIntoView = vi.fn();
}
