import CodeMirror from '../../../../../utils/codemirror/lib/codemirror';

/**
 * Ensure the autocomplete command is configured to use our dictionary hint provider.
 */
export function ensureAutocompleteCommand() {
  CodeMirror.commands.autocomplete = function (cm) {
    CodeMirror.showHint(cm, (CodeMirror as any).hint.dictionaryHint, {
      completeSingle: false,
    });
  };
}
