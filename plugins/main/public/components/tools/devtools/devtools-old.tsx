import React, { useState } from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { getUiSettings } from '../../../kibana-services';
import { withGlobalBreadcrumb } from '../../common/hocs';
import { devTools } from '../../../utils/applications';
import { CONSOLE_CONTAINER } from './constants';
import { saveEditorContentAsJson, send } from './lib';
import useHotkeyForDevTools from './application/hooks/use-hotkey-for-dev-tools';
import useSetup from './application/hooks/use-setup';
import DevToolTabs from './application/components/dev-tools-tabs';
import DevToolsHeader from './application/components/dev-tools-header';
import DevToolsMirrors from './application/components/dev-tools-mirrors';

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

  const onSendRequestButton = () =>
    send(editorInputRef.current, editorOutputRef.current, false, {
      onStart: () => setRequestMeta({ loading: true }),
      onEnd: meta =>
        setRequestMeta({
          loading: false,
          ...meta,
        }),
    });

  const useUpdatedUX = getUiSettings().get('home:useNewHomePage');
  useHotkeyForDevTools({ onSendRequestButton });

  return (
    <>
      <DevToolTabs />
      <EuiFlexGroup
        style={{
          padding: `${CONSOLE_CONTAINER.padding}px`,
          margin: 0,
          '--col-separator-width': '14px',
          '--col-left-width': '46.5%',
          '--col-right-width': 'calc(100% - var(--col-left-width))',
        }}
        direction='column'
        gutterSize='none'
        className='wz-dev-tools'
      >
        <EuiFlexItem>
          <DevToolsHeader
            useUpdatedUX={useUpdatedUX}
            {...requestMeta}
            loading={!!requestMeta?.loading}
            show={!!requestMeta}
            onClickExport={() => {
              saveEditorContentAsJson(editorOutputRef.current);
            }}
          />
          <DevToolsMirrors onSendRequestButton={onSendRequestButton} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
});
