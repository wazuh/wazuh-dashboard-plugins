import { DEV_TOOLS_INITIAL_BUFFER } from './initial-buffer';

describe('DEV_TOOLS_INITIAL_BUFFER', () => {
  it('should not include the word "Wazuh" (case-insensitive)', () => {
    expect(DEV_TOOLS_INITIAL_BUFFER).not.toMatch(/wazuh/i);
  });

  it('should not include links to the official documentation', () => {
    // Any appearance of the docs domain or full URL should be forbidden
    expect(DEV_TOOLS_INITIAL_BUFFER).not.toMatch(/documentation\.wazuh\.com/i);
    expect(DEV_TOOLS_INITIAL_BUFFER).not.toMatch(
      /https?:\/\/documentation\.wazuh\.com/i,
    );
  });
});
