import { useEffect, useRef, type MutableRefObject } from 'react';
import { AppState } from '../../../../../react-services';
import { showMenuSelector } from '../../../../../redux/selectors/appStateSelectors';
import { getUiSettings } from '../../../../../kibana-services';
import CodeMirror from '../../../../../utils/codemirror/lib/codemirror';
import { initEditors, send } from '../../lib';
import { EDITOR_MIRRORS } from '../../constants';
import { useSelector } from 'react-redux';

const useSetup = () => {
  const isDarkThemeEnabled = getUiSettings().get('theme:darkMode');
  const showMenu: boolean = useSelector(showMenuSelector);

  const editorInputRef = useRef<
    ReturnType<typeof CodeMirror.fromTextArea>
  >() as MutableRefObject<CodeMirror.Editor>;
  const editorOutputRef = useRef<
    ReturnType<typeof CodeMirror.fromTextArea>
  >() as MutableRefObject<CodeMirror.Editor>;

  useEffect(() => {
    (async function () {
      // Ensure menu is visible when loading the tool
      if (!showMenu) {
        AppState.setWzMenu();
      }

      editorInputRef.current = CodeMirror.fromTextArea(
        window.document.getElementById(EDITOR_MIRRORS.INPUT_ID),
        {
          lineNumbers: true,
          matchBrackets: true,
          mode: { name: 'http-request', json: true },
          styleSelectedText: true,
          foldGutter: true,
          gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
          theme: isDarkThemeEnabled ? 'lesser-dark' : 'http-request',
        },
      );
      editorOutputRef.current = CodeMirror.fromTextArea(
        window.document.getElementById(EDITOR_MIRRORS.OUTPUT_ID),
        {
          lineNumbers: true,
          matchBrackets: true,
          mode: { name: 'http-request', json: true },
          readOnly: true,
          lineWrapping: true,
          styleActiveLine: true,
          foldGutter: true,
          gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
          theme: isDarkThemeEnabled ? 'lesser-dark' : 'http-request',
        },
      );
      // Configure behavior, routes and layout
      await initEditors(editorInputRef.current, editorOutputRef.current);
      // Render welcome message and position UI controls
      send(editorInputRef.current, editorOutputRef.current, true);
    })();

    return () => {};
  }, []);

  return { editorInputRef, editorOutputRef };
};

export default useSetup;
