import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { createMemoryHistory } from 'history';
import { AppMountParameters, CoreStart } from '../../../../../src/core/public';
import { PLUGIN_ID } from '../../../common/constants';
import { ChatPage } from '../chat/chat-page';
import { useProviders } from '../../hooks/use-providers';
import {
  confirmInterruption,
  interruptConfirmationText,
} from '../../services/interrupt-confirm';

interface AssistantChatFlyoutProps {
  core: CoreStart;
  onClose: () => void;
}

const FLYOUT_MAX_WIDTH = 1150;

export const AssistantChatFlyout: React.FC<AssistantChatFlyoutProps> = ({
  core,
  onClose,
}) => {
  const {
    providers,
    providersLoaded,
    providersError,
    selectedProviderId,
    setSelectedProviderId,
  } = useProviders(core.http);
  const [chatHistory] = useState(
    () => createMemoryHistory() as unknown as AppMountParameters['history'],
  );
  const titleId = useId();

  const isGeneratingRef = useRef(false);
  const handleGeneratingChange = useCallback((generating: boolean) => {
    isGeneratingRef.current = generating;
  }, []);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isGeneratingRef.current) {
        event.preventDefault();
        event.returnValue = interruptConfirmationText();
      }
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, []);

  const runGuarded = useCallback(
    (action: () => void) => {
      if (!isGeneratingRef.current) {
        action();
        return;
      }
      void confirmInterruption(core.overlays).then(confirmed => {
        if (confirmed) {
          action();
        }
      });
    },
    [core.overlays],
  );

  const requestClose = useCallback(
    () => runGuarded(onClose),
    [runGuarded, onClose],
  );

  const openSettings = useCallback(
    () =>
      runGuarded(() => {
        onClose();
        void core.application.navigateToApp(PLUGIN_ID, { path: '#/settings' });
      }),
    [runGuarded, onClose, core.application],
  );

  const settingsLabel = i18n.translate(
    'wazuhAiAssistant.headerFlyout.settingsButtonLabel',
    { defaultMessage: 'AI Assistant settings' },
  );

  return (
    <EuiFlyout
      onClose={requestClose}
      size='l'
      maxWidth={FLYOUT_MAX_WIDTH}
      aria-labelledby={titleId}
      data-test-subj='wzAiAssistantFlyout'
    >
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
          <EuiFlexItem>
            <EuiTitle size='s'>
              <h2 id={titleId}>
                {i18n.translate('wazuhAiAssistant.headerFlyout.title', {
                  defaultMessage: 'AI Assistant',
                })}
              </h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false} style={{ marginRight: 32 }}>
            <EuiToolTip content={settingsLabel}>
              <EuiButtonIcon
                iconType='gear'
                color='text'
                aria-label={settingsLabel}
                onClick={openSettings}
                data-test-subj='wzAiAssistantFlyoutSettingsButton'
              />
            </EuiToolTip>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>
      <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto' }}>
        <div style={{ height: '100%' }}>
          <ChatPage
            core={core}
            history={chatHistory}
            providers={providers}
            providersLoaded={providersLoaded}
            providersError={providersError}
            selectedProviderId={selectedProviderId}
            onProviderChange={setSelectedProviderId}
            onNavigateToSettings={openSettings}
            onGeneratingChange={handleGeneratingChange}
          />
        </div>
      </div>
    </EuiFlyout>
  );
};
