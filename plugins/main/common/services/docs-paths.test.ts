import { DOCS_PATHS } from './docs-paths';

describe('DOCS_PATHS', () => {
  it('keeps the paths relative to the documentation of the version', () => {
    Object.values(DOCS_PATHS).forEach(path => {
      expect(path).not.toMatch(/^(\/|https?:)/);
      expect(path).toMatch(/\.html(#.+)?$/);
    });
  });
});
