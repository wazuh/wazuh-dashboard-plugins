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
import { ChatPage, ConversationsSnapshot } from '../chat/chat-page';
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

/** Panel width above which the saved-conversations rail auto-prefers its expanded form (a full
 * list, not just the collapsed icon strip) — below it the icon strip is the auto default, though
 * either width can still be overridden by the toolbar toggle below. Below this width the rail is
 * NEVER hidden outright: ChatPage's own `allowRailFlyout={false}` already caps it at the collapsed
 * strip rather than a full-screen flyout, so "New conversation" and "Search" stay reachable at any
 * panel width without an extra click. */
const SIDEBAR_MIN_PANEL_WIDTH = 600;

const emptyConversationsSnapshot: ConversationsSnapshot = {
  conversations: [],
  isLoading: false,
  activeConversationId: null,
};

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
  // Whether the rail PREFERS its expanded form over the collapsed icon strip — never whether it
  // renders at all (see `SIDEBAR_MIN_PANEL_WIDTH`'s own doc comment above: the rail is always
  // shown, at minimum as the collapsed strip). Passed to ChatPage as `railDisplayModeOverride`.
  const [railExpanded, setRailExpanded] = useState(false);
  // Flipped the first time the toolbar toggle below is used: once the user has taken explicit
  // control of the rail's mode, further panel resizes must not silently override their choice (the
  // resize-driven default below is a starting point, not a standing rule).
  const railModeManuallySetRef = useRef(false);
  // ChatPage owns the actual saved-conversations state (it loads/saves them) — this panel only
  // mirrors it, via `onConversationsChange` below, to render the header's own title/subtitle.
  const [conversationsSnapshot, setConversationsSnapshot] = useState(
    emptyConversationsSnapshot,
  );

  const untitledConversationLabel = i18n.translate(
    'wazuhAiAssistant.headerPanel.untitledConversation',
    { defaultMessage: 'Untitled' },
  );
  // The active conversation's own saved title, looked up from the mirrored snapshot (never
  // re-derived) — `undefined` both for a brand-new, never-yet-saved conversation AND for one
  // whose row hasn't reached this mirror yet, so both fall back to the same "Untitled" label
  // rather than the header briefly reading blank.
  const activeConversationTitle =
    conversationsSnapshot.conversations.find(
      conversation =>
        conversation.id === conversationsSnapshot.activeConversationId,
    )?.title ?? untitledConversationLabel;

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
      if (railModeManuallySetRef.current) {
        return;
      }
      setRailExpanded(element.offsetWidth >= SIDEBAR_MIN_PANEL_WIDTH);
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const toggleRailMode = useCallback(() => {
    railModeManuallySetRef.current = true;
    setRailExpanded(expanded => !expanded);
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

  /**
   * Hands the conversation off to the app-shell chat page (`#/`, the plugin's default route) —
   * the same full-width surface the sidecar renders a narrow view of. Goes through `runGuarded`
   * and closes the sidecar first, exactly like `openSettings`: leaving it docked over the page it
   * just navigated to would show the chat twice.
   */
  const openFullPage = useCallback(
    () =>
      runGuarded(() => {
        onClose();
        void core.application.navigateToApp(PLUGIN_ID, { path: '#/' });
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

  const expandConversationsLabel = i18n.translate(
    'wazuhAiAssistant.headerPanel.expandConversationsButtonLabel',
    {
      defaultMessage: 'Expand saved conversations',
    },
  );
  const collapseConversationsLabel = i18n.translate(
    'wazuhAiAssistant.headerPanel.collapseConversationsButtonLabel',
    {
      defaultMessage: 'Collapse saved conversations',
    },
  );
  const maximizeLabel = i18n.translate(
    'wazuhAiAssistant.headerPanel.maximizeButtonLabel',
    {
      defaultMessage: 'Open the AI Assistant in full page',
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
          <EuiFlexItem style={{ minWidth: 0 }}>
            <div>
              <EuiTitle size='xs'>
                <h2 id={titleId}>
                  {i18n.translate('wazuhAiAssistant.headerPanel.title', {
                    defaultMessage: 'AI Assistant',
                  })}
                </h2>
              </EuiTitle>
              {/* The active conversation's own title (or "Untitled" for a brand-new,
                never-yet-saved one) — a subtitle under the panel's own name rather than a
                replacement for it, so the sidecar keeps reading as "AI Assistant" first even once
                a conversation is open.
                `display: flex` here is what lets a long title truncate: `EuiToolTip` always wraps
                its child in an inline-block `span` (`wzAiAssistantTitleTooltipAnchor`,
                chat-page.scss) whose `width: auto` sizing, under ordinary block/inline-block
                shrink-to-fit rules, can never go below its content's own min-content width — and
                `white-space: nowrap` makes a long title's min-content width the FULL one-line
                width, so the anchor simply overflowed this column no matter what `max-width` the
                text inside it asked for. Flex-shrink uses a DIFFERENT algorithm with no such
                floor, provided the item's automatic minimum size is zeroed out — which
                `overflow: hidden` on that same anchor class does per spec, since a flex item's
                automatic min-width computes to 0 rather than content-based when its own
                `overflow` isn't `visible`. That shrunk, now-definite anchor width is what finally
                lets the plain `span` inside truncate against a real number instead of an
                indefinite one. For a SHORT title, this flex item just renders at its natural
                (small) size — grow defaults to 0, so it never stretches to fill the column. */}
              <div style={{ display: 'flex' }}>
                <EuiToolTip
                  content={activeConversationTitle}
                  anchorClassName='wzAiAssistantTitleTooltipAnchor'
                >
                  <span
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      fontSize: '0.75rem',
                      color: 'var(--wz-text-subdued)',
                    }}
                  >
                    {activeConversationTitle}
                  </span>
                </EuiToolTip>
              </div>
            </div>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiToolTip
              content={
                railExpanded
                  ? collapseConversationsLabel
                  : expandConversationsLabel
              }
            >
              <EuiButtonIcon
                iconType={railExpanded ? 'menuLeft' : 'menuRight'}
                color='text'
                aria-label={
                  railExpanded
                    ? collapseConversationsLabel
                    : expandConversationsLabel
                }
                aria-pressed={railExpanded}
                onClick={toggleRailMode}
                data-test-subj='wzAiAssistantPanelToggleSidebarButton'
              />
            </EuiToolTip>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiToolTip content={maximizeLabel}>
              <EuiButtonIcon
                iconType='expand'
                color='text'
                aria-label={maximizeLabel}
                onClick={openFullPage}
                data-test-subj='wzAiAssistantPanelMaximizeButton'
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
            onConversationsChange={setConversationsSnapshot}
            // Always rendered (never hidden outright, see `SIDEBAR_MIN_PANEL_WIDTH`'s own doc
            // comment): `railDisplayModeOverride` below is what the toolbar toggle actually drives.
            showConversationSidebar
            railDisplayModeOverride={railExpanded ? 'expanded' : 'collapsed'}
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
