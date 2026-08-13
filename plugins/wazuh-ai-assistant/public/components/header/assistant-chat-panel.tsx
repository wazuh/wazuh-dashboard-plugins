import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { createMemoryHistory } from 'history';
import { AppMountParameters, CoreStart } from '../../../../../src/core/public';
import { PLUGIN_ID } from '../../../common/constants';
import { ChatPage } from '../chat/chat-page';
import { useProviders } from '../../hooks/use-providers';
import { interruptConfirmationText } from '../../services/interrupt-confirm';

interface AssistantChatPanelProps {
  core: CoreStart;
  /** Closes the sidecar without confirmation — always call it through `runGuarded`. */
  onClose: () => void;
  /** Interrupt-confirm gate owned by the header button, shared with its toggle-close path. */
  runGuarded: (action: () => void) => void;
  /** Shared with the header button so both close paths see the generating state. */
  isGeneratingRef: React.MutableRefObject<boolean>;
}

/** Panel width from which the saved-conversations sidebar fits beside the chat column without
 * the toolbar toggle below — it still opens narrower than this on request. */
const SIDEBAR_MIN_PANEL_WIDTH = 600;

export const AssistantChatPanel: React.FC<AssistantChatPanelProps> = ({
  core,
  onClose,
  runGuarded,
  isGeneratingRef,
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
  const rootRef = useRef<HTMLElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Flipped the first time the toolbar toggle below is used: once the user has taken explicit
  // control of the sidebar, further panel resizes must not silently override their choice (the
  // resize-driven default below is a starting point, not a standing rule).
  const sidebarManuallySetRef = useRef(false);

  const handleGeneratingChange = useCallback(
    (generating: boolean) => {
      isGeneratingRef.current = generating;
    },
    [isGeneratingRef],
  );

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isGeneratingRef.current) {
        event.preventDefault();
        event.returnValue = interruptConfirmationText();
      }
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isGeneratingRef]);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) {
      return undefined;
    }
    const update = () => {
      if (sidebarManuallySetRef.current) {
        return;
      }
      setSidebarOpen(element.offsetWidth >= SIDEBAR_MIN_PANEL_WIDTH);
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The resize-driven default above is a convenience, not the only way in: a panel narrower than
  // SIDEBAR_MIN_PANEL_WIDTH never triggered it, so the conversation list was reachable only by
  // dragging the sidecar wider — an affordance nothing in the panel hinted at. This toolbar
  // toggle makes the list reachable at any width.
  const toggleSidebar = useCallback(() => {
    sidebarManuallySetRef.current = true;
    setSidebarOpen(open => !open);
  }, []);

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

  const openSettingsToAddProvider = useCallback(
    () =>
      runGuarded(() => {
        onClose();
        void core.application.navigateToApp(PLUGIN_ID, {
          path: '#/settings?addProvider=true',
        });
      }),
    [runGuarded, onClose, core.application],
  );

  const showConversationsLabel = i18n.translate(
    'wazuhAiAssistant.headerPanel.showConversationsButtonLabel',
    {
      defaultMessage: 'Show saved conversations',
    },
  );
  const hideConversationsLabel = i18n.translate(
    'wazuhAiAssistant.headerPanel.hideConversationsButtonLabel',
    {
      defaultMessage: 'Hide saved conversations',
    },
  );
  const settingsLabel = i18n.translate(
    'wazuhAiAssistant.headerPanel.settingsButtonLabel',
    {
      defaultMessage: 'AI Assistant settings',
    },
  );
  const closeLabel = i18n.translate(
    'wazuhAiAssistant.headerPanel.closeButtonLabel',
    {
      defaultMessage: 'Close the AI Assistant',
    },
  );

  return (
    <section
      ref={rootRef}
      // `wzAiChat`: the same `--wz-*` token block chat-page.scss defines for the app-shell chat
      // surface — applied here too so this panel's own chrome (the header border below) reads
      // from it instead of a hardcoded hex. ChatPage's nested `wzAiChat` div just redefines the
      // same custom properties redundantly.
      className='wzAiChat'
      aria-labelledby={titleId}
      data-test-subj='wzAiAssistantPanel'
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--wz-hairline)',
          flexShrink: 0,
        }}
      >
        <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
          <EuiFlexItem>
            <EuiTitle size='xs'>
              <h2 id={titleId}>
                {i18n.translate('wazuhAiAssistant.headerPanel.title', {
                  defaultMessage: 'AI Assistant',
                })}
              </h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiToolTip
              content={
                sidebarOpen ? hideConversationsLabel : showConversationsLabel
              }
            >
              <EuiButtonIcon
                iconType={sidebarOpen ? 'menuLeft' : 'menuRight'}
                color='text'
                aria-label={
                  sidebarOpen ? hideConversationsLabel : showConversationsLabel
                }
                aria-pressed={sidebarOpen}
                onClick={toggleSidebar}
                data-test-subj='wzAiAssistantPanelToggleSidebarButton'
              />
            </EuiToolTip>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiToolTip content={settingsLabel}>
              <EuiButtonIcon
                iconType='gear'
                color='text'
                aria-label={settingsLabel}
                onClick={openSettings}
                data-test-subj='wzAiAssistantPanelSettingsButton'
              />
            </EuiToolTip>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiToolTip content={closeLabel}>
              <EuiButtonIcon
                iconType='cross'
                color='text'
                aria-label={closeLabel}
                onClick={requestClose}
                data-test-subj='wzAiAssistantPanelCloseButton'
              />
            </EuiToolTip>
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
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
            onNavigateToSettings={openSettingsToAddProvider}
            onGeneratingChange={handleGeneratingChange}
            showConversationSidebar={sidebarOpen}
            // This panel's own width (`SIDEBAR_MIN_PANEL_WIDTH` above) routinely sits inside
            // ChatPage's flyout band (600-900px) — an `EuiFlyout` there would cover the WHOLE
            // dashboard, opening from the right, just to show a left-hand rail, out of a docked
            // sidecar the user never asked to leave. Capped at the collapsed strip instead; see
            // ChatPage's own `allowRailFlyout` doc comment.
            allowRailFlyout={false}
          />
        </div>
      </div>
    </section>
  );
};
