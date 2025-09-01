import React, { useEffect, useRef, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTab,
  EuiTabs,
  EuiIcon,
  EuiBadge,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { getUiSettings } from '../../../kibana-services';
import { withGlobalBreadcrumb } from '../../common/hocs';
import { devTools } from '../../../utils/applications';
import { TopNavMenu } from './application/components/top-nav/top-nav-menu';
import { getTopNavConfig } from './application/components/top-nav/get-top-nav';
import DevToolsColumnSeparator from './application/components/separator/dev-tools-column-separator';
import { CONSOLE_CONTAINER } from './constants';
import { send, saveEditorContentAsJson } from './lib/actions';
import useHotkeyForDevTools from './application/hooks/use-hotkey-for-dev-tools';
import useSetup from './application/hooks/use-setup';

/**
 * Wazuh DevTools Console.
 *
 * Provides a split view with an editable API request buffer and a read-only
 * response viewer. CTRL/CMD + ENTER runs the current request.
 */
export const ToolDevTools = withGlobalBreadcrumb([
  { text: devTools.breadcrumbLabel },
])(() => {
  const { editorInputRef, editorOutputRef } = useSetup();
  const [requestMeta, setRequestMeta] = useState<{
    loading: boolean;
    status?: number;
    statusText?: string;
    durationMs?: number;
    ok?: boolean;
  } | null>(null);

  const useUpdatedUX = getUiSettings().get('home:useNewHomePage');
  useHotkeyForDevTools({
    editorInputRef,
    editorOutputRef,
    onStart: () => setRequestMeta({ loading: true }),
    onEnd: meta =>
      setRequestMeta({
        loading: false,
        ...meta,
      }),
  });

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
            <EuiFlexItem
              style={{
                justifyContent: 'center',
              }}
            >
              {/* Request status indicator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  justifyContent: 'flex-end',
                }}
              >
                {requestMeta?.loading ? (
                  <EuiBadge color='hollow'>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <EuiLoadingSpinner size='s' />
                      Request in progress
                    </span>
                  </EuiBadge>
                ) : requestMeta ? (
                  <>
                    <EuiBadge color={requestMeta.ok ? 'success' : 'danger'}>
                      {requestMeta.status
                        ? `${requestMeta.status} - ${
                            requestMeta.statusText ||
                            (requestMeta.ok ? 'OK' : 'ERROR')
                          }`
                        : requestMeta.ok
                        ? 'OK'
                        : 'ERROR'}
                    </EuiBadge>
                    {typeof requestMeta.durationMs !== 'undefined' && (
                      <EuiBadge color='hollow'>
                        {Math.max(0, Math.round(requestMeta.durationMs))} ms
                      </EuiBadge>
                    )}
                  </>
                ) : null}
              </div>
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
                    send(
                      editorInputRef.current,
                      editorOutputRef.current,
                      false,
                      {
                        onStart: () => setRequestMeta({ loading: true }),
                        onEnd: meta =>
                          setRequestMeta({
                            loading: false,
                            ...meta,
                          }),
                      },
                    )
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
