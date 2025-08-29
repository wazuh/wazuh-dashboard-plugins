import React, { useEffect, useRef, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTab,
  EuiTabs,
  EuiIcon,
} from '@elastic/eui';
import CodeMirror from '../../../utils/codemirror/lib/codemirror';
import $ from 'jquery';
import store from '../../../redux/store';
import { getUiSettings } from '../../../kibana-services';
import { withGlobalBreadcrumb } from '../../common/hocs';
import { devTools } from '../../../utils/applications';
import { Keys } from './types/keys';
import { TopNavMenu } from './application/components/top-nav/top-nav-menu';
import { getTopNavConfig } from './application/components/top-nav/get-top-nav';
import DevToolsColumnSeparator from './application/components/separator/dev-tools-column-separator';
import { CONSOLE_CONTAINER } from './constants';
import { AppState } from '../../../react-services';
import { initEditors } from './lib/init';
import { send, saveEditorContentAsJson } from './lib/actions';

/**
 * Wazuh DevTools Console.
 *
 * Provides a split view with an editable API request buffer and a read-only
 * response viewer. SHIFT + ENTER runs the current request.
 */
export const ToolDevTools = withGlobalBreadcrumb([
  { text: devTools.breadcrumbLabel },
])(() => {
  const [multipleKeyPressed, setMultipleKeyPressed] = useState<number[]>([]);
  const editorInputRef = useRef<any>();
  const editorOutputRef = useRef<any>();

  const useUpdatedUX = getUiSettings().get('home:useNewHomePage');

  useEffect(() => {
    (async function () {
      const isDarkThemeEnabled = getUiSettings().get('theme:darkMode');

      // Ensure menu is visible when loading the tool
      if (
        store.getState() &&
        (store.getState() as any).appStateReducers &&
        !(store.getState() as any).appStateReducers.showMenu
      ) {
        AppState.setWzMenu();
      }

      // Send request on SHIFT + ENTER
      $(window.document).on('keydown', e => {
        if (!multipleKeyPressed.includes(e.which)) {
          setMultipleKeyPressed(state => [...state, e.which]);
        }
        if (
          multipleKeyPressed.includes(Keys.ENTER) &&
          multipleKeyPressed.includes(Keys.SHIFT) &&
          multipleKeyPressed.length === 2
        ) {
          e.preventDefault();
          return send(editorInputRef.current, editorOutputRef.current);
        }
      });
      $(window.document).on('keyup', () => setMultipleKeyPressed([]));

      // Create CodeMirror editors
      editorInputRef.current = CodeMirror.fromTextArea(
        window.document.getElementById('api_input'),
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
        window.document.getElementById('api_output'),
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
  }, []);

  return (
    <div id='wz-dev-tools-container'>
      <EuiTabs size='s'>
        <EuiTab isSelected={true}>Console</EuiTab>
      </EuiTabs>
      <EuiFlexGroup
        style={{ padding: `${CONSOLE_CONTAINER.padding}px`, margin: 0 }}
        direction='column'
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            // @ts-ignore
            '--col-separator-width': '14px',
            '--col-left-width': '46.5%',
            '--col-right-width': 'calc(100% - var(--col-left-width))',
          }}
          className='wz-dev-tools'
        >
          <EuiFlexGroup gutterSize='none'>
            <EuiFlexItem>
              <TopNavMenu
                useUpdatedUX={useUpdatedUX}
                items={getTopNavConfig({
                  useUpdatedUX,
                  onClickExport: () =>
                    saveEditorContentAsJson(editorOutputRef.current),
                })}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div
              id='wz-dev-left-column'
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              <div
                id='wz-dev-tools-buttons'
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  position: 'relative',
                  left: '-1.25rem',
                  gap: '0.25rem',
                  height: 0,
                }}
              >
                <EuiIcon
                  type='play'
                  onClick={() =>
                    send(editorInputRef.current, editorOutputRef.current)
                  }
                  title='Send request'
                  className='cursor-pointer wz-always-top'
                  id='wz-dev-tools-buttons--send-request'
                  color='success'
                />
                <a
                  href=''
                  target='__blank'
                  title='Open documentation'
                  className='cursor-pointer wz-always-top'
                  id='wz-dev-tools-buttons--go-to-api-reference'
                >
                  <EuiIcon type='documentation' />
                </a>
              </div>
              <textarea style={{ display: 'flex' }} id='api_input'></textarea>
            </div>
            <DevToolsColumnSeparator />
            <div
              id='wz-dev-right-column'
              style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}
            >
              <textarea style={{ display: 'flex' }} id='api_output'></textarea>
            </div>
          </div>
        </div>
      </EuiFlexGroup>
    </div>
  );
});
