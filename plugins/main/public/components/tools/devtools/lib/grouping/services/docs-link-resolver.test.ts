import { resolveDocsUrl } from './docs-link-resolver';

describe('resolveDocsUrl', () => {
  const editor: any = {
    model: [
      {
        method: 'GET',
        endpoints: [
          { name: '/agents', documentation: 'url://list' },
          { name: '/agents/:id', documentation: 'url://by-id' },
        ],
      },
      {
        method: 'POST',
        endpoints: [{ name: '/agents', documentation: 'url://create' }],
      },
    ],
  };

  it('matches exact endpoint path', () => {
    const url = resolveDocsUrl(editor, 'GET /agents');
    expect(url).toBe('url://list');
  });

  it('matches dynamic segments and is case-insensitive on path', () => {
    const url = resolveDocsUrl(editor, 'GET /AGENTS/123');
    expect(url).toBe('url://by-id');
  });

  it('returns null when method not found', () => {
    expect(resolveDocsUrl(editor, 'DELETE /agents/1')).toBeNull();
  });

  it('returns null for invalid input line', () => {
    expect(resolveDocsUrl(editor, '')).toBeNull();
    expect(resolveDocsUrl(null as any, 'GET /agents')).toBeNull();
    expect(resolveDocsUrl(editor, 'INVALID')).toBeNull();
  });
});
