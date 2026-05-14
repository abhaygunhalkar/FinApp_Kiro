import { describe, it, expect } from 'vitest';

describe('Test infrastructure', () => {
  it('vitest is configured correctly', () => {
    expect(true).toBe(true);
  });

  it('jest-dom matchers are available', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello';
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
    document.body.removeChild(div);
  });
});
