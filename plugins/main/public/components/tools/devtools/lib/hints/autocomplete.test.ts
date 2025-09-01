import { ensureAutocompleteCommand } from './autocomplete';

jest.mock('../../../../../utils/codemirror/lib/codemirror', () => ({
  commands: {},
  showHint: jest.fn(),
  hint: { dictionaryHint: jest.fn() },
}));

describe('ensureAutocompleteCommand', () => {
  it('wires CodeMirror.commands.autocomplete to show dictionaryHint', () => {
    const CM = require('../../../../../utils/codemirror/lib/codemirror');
    ensureAutocompleteCommand();
    expect(typeof CM.commands.autocomplete).toBe('function');
    const cmInstance = {};
    CM.commands.autocomplete(cmInstance);
    expect(CM.showHint).toHaveBeenCalledWith(
      cmInstance,
      CM.hint.dictionaryHint,
      { completeSingle: false },
    );
  });
});
