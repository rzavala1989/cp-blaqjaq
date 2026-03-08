import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('exports a valid component', () => {
    expect(typeof App).toBe('function');
  });
});
