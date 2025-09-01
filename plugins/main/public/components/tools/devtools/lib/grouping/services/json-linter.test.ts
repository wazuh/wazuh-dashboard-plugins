import { DefaultJsonLinter } from './json-linter';

jest.mock('../../../../../../utils/codemirror/json-lint', () => ({
  __esModule: true,
  default: { parse: jest.fn() },
}));

describe('DefaultJsonLinter', () => {
  it('delegates parse to json-lint implementation', async () => {
    const mod = await import('../../../../../../utils/codemirror/json-lint');
    const linter = new DefaultJsonLinter();
    linter.parse('{"a":1}');
    expect(mod.default.parse).toHaveBeenCalledWith('{"a":1}');
  });
});

