// Manual Jest mock for utils/io used by unit tests.
// Exports jest.fn-based stubs so tests can customize behavior per case.

export const readJsonFile = jest.fn(<T,>(absolutePath: string): T => {
  // Default behavior: throw to force tests to define expectations explicitly
  throw new Error(`readJsonFile mock not implemented for: ${absolutePath}`);
});

export const writeFile = jest.fn((absolutePath: string, _content: string): void => {
  // Default: act as no-op to allow tests that do not validate writes
});

