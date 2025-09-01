import CodeMirror from '../../../../../utils/codemirror/lib/codemirror';
import { analyzeGroups, calculateWhichGroup } from '../grouping';
import { createDictionaryHintProvider } from './dictionary/factory';
import { logUiError } from './dictionary/utils/logging-adapter';
import {
  limitToSingleQuestionMark,
  sortCaseInsensitive,
} from './dictionary/utils/hint-utils';

/**
 * Register a CodeMirror hint helper that provides endpoint, query and body parameter hints.
 * Requires that `editorInput.model` contains the available API description.
 */
export function registerDictionaryHint(editorInput: any) {
  const provider = createDictionaryHintProvider({
    analyzeGroups,
    calculateWhichGroup,
    logError: logUiError,
    getModel: () => editorInput.model,
  });

  CodeMirror.registerHelper('hint', 'dictionaryHint', function (editor: any) {
    const cur = editor.getCursor();
    const curLine = editor.getLine(cur.line);
    let start = cur.ch;
    let end = start;
    const whiteSpace = /\s/;
    while (end < curLine.length && !whiteSpace.test(curLine.charAt(end))) ++end;
    while (start && !whiteSpace.test(curLine.charAt(start - 1))) --start;
    const curWord = start !== end ? curLine.slice(start, end) : '';

    const unfiltered = provider.buildHints(editor, curLine, curWord || '');
    const filtered = unfiltered.filter((item: any) => {
      if (!curWord) return true;
      const text = (item as any).text ?? item;
      return String(text).toUpperCase().includes(String(curWord).toUpperCase());
    });
    const normalized = limitToSingleQuestionMark(filtered);
    const sortedList = sortCaseInsensitive(normalized);

    return {
      list: sortedList,
      from: CodeMirror.Pos(cur.line, start),
      to: CodeMirror.Pos(cur.line, end),
    };
  });
}
