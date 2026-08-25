import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPopover,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { createMemoryHistory } from 'history';
import { AppMountParameters, CoreStart } from '../../../../../src/core/public';
import { PLUGIN_ID } from '../../../common/constants';
import {
  ChatPage,
  ChatPageHandle,
  ConversationsSnapshot,
} from '../chat/chat-page';
import { ConversationList } from '../chat/conversation-list';
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

/** Width of the saved-conversations popover panel (chat-page.tsx's inline rail uses the same
 * `CONVERSATION_SIDEBAR_WIDTH`, but that constant is private to that file — this popover is a
 * wholly separate rendering of the same `ConversationList`, not a mode of that rail, so it owns
 * its own width rather than reaching into chat-page.tsx for one). */
const CONVERSATIONS_POPOVER_WIDTH = 320;
/** Max height of the popover panel before its own `ConversationList` scroll region takes over
 * (`.wzConvoRail`/`.wzConvoRailScroll`, conversation-list.scss) — without a cap a long history
 * would grow the popover panel itself instead of scrolling inside it. */
const CONVERSATIONS_POPOVER_HEIGHT = 420;

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
  const chatPageRef = useRef<ChatPageHandle>(null);
  // ChatPage owns the actual saved-conversations state (it loads/saves them) — this panel only
  // mirrors it, via `onConversationsChange` below, to render the popover's own trigger/content.
  const [conversationsSnapshot, setConversationsSnapshot] = useState(
    emptyConversationsSnapshot,
  );
  const [isConversationsPopoverOpen, setIsConversationsPopoverOpen] =
    useState(false);

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

  const closeConversationsPopover = useCallback(() => {
    setIsConversationsPopoverOpen(false);
  }, []);

  const toggleConversationsPopover = useCallback(() => {
    setIsConversationsPopoverOpen(open => !open);
  }, []);

  const handleNewConversation = useCallback(() => {
    chatPageRef.current?.newConversation();
    closeConversationsPopover();
  }, [closeConversationsPopover]);

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

  const newConversationLabel = i18n.translate(
    'wazuhAiAssistant.headerPanel.newConversationButtonLabel',
    {
      defaultMessage: 'New conversation',
    },
  );
  const conversationsLabel = i18n.translate(
    'wazuhAiAssistant.headerPanel.conversationsButtonLabel',
    {
      defaultMessage: 'Saved conversations',
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
            {/* A plain block `div`, NOT two direct `EuiFlexItem` children: `EuiFlexItem` is itself
              `display: flex; flex-direction: column` (EUI's own CSS), whose default
              `align-items: stretch` forces every child — including the tooltip's own anchor
              `span` below — to stretch to this column's FULL width regardless of that child's own
              `display`. That stretched span, not the short text inside it, was what `EuiToolTip`
              was actually hovering/triggering on. A plain non-flex wrapper here means the anchor
              span is an ordinary inline-block box again, sized to its own content. */}
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
                `display: flex` here (a SECOND, inner flex context, not the outer `EuiFlexItem`
                whose own stretch this component's other doc comment already routes around) is what
                actually lets a long title truncate: `EuiToolTip` always wraps its child in an
                inline-block `span` (`wzAiAssistantTitleTooltipAnchor` below) whose `width: auto`
                sizing, under ordinary block/inline-block shrink-to-fit rules, can never go below
                its content's own min-content width — and `white-space: nowrap` makes a long title's
                min-content width the FULL one-line width, so the anchor simply overflowed this
                column (running under the header's own icon buttons) no matter what `max-width` the
                text inside it asked for. Flex-shrink uses a DIFFERENT algorithm with no such floor,
                PROVIDED the item's automatic minimum size is zeroed out — which `overflow: hidden`
                on that same anchor class (a plain CSS rule, not inline: `anchorClassName` only
                accepts a class) does per spec, since a flex item's automatic min-width computes to
                0 rather than content-based when its own `overflow` isn't `visible`. That shrunk,
                now-DEFINITE anchor width is what finally lets the plain `span` inside truncate
                against a real number instead of an indefinite one. For a SHORT title, this flex
                item just renders at its natural (small) size — grow defaults to 0, so it never
                stretches to fill the column the way `EuiFlexItem`'s OWN children did before. */}
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
            <EuiToolTip content={newConversationLabel}>
              <EuiButtonIcon
                iconType='plusInCircle'
                color='text'
                aria-label={newConversationLabel}
                onClick={handleNewConversation}
                data-test-subj='wzAiAssistantPanelNewConversationButton'
              />
            </EuiToolTip>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiPopover
              isOpen={isConversationsPopoverOpen}
              closePopover={closeConversationsPopover}
              anchorPosition='downRight'
              panelPaddingSize='none'
              button={
                <EuiToolTip content={conversationsLabel}>
                  <EuiButtonIcon
                    iconType='list'
                    // Filled + primary while open — the same "active toggle" look EUI's own filter
                    // buttons use, so the header shows which state the popover is in.
                    color={isConversationsPopoverOpen ? 'primary' : 'text'}
                    display={isConversationsPopoverOpen ? 'fill' : 'empty'}
                    aria-label={conversationsLabel}
                    aria-pressed={isConversationsPopoverOpen}
                    onClick={toggleConversationsPopover}
                    data-test-subj='wzAiAssistantPanelToggleSidebarButton'
                  />
                </EuiToolTip>
              }
            >
              <EuiPanel
                color='plain'
                hasShadow={false}
                hasBorder={false}
                paddingSize='m'
                className='wzConvoRail'
                style={{
                  width: CONVERSATIONS_POPOVER_WIDTH,
                  height: CONVERSATIONS_POPOVER_HEIGHT,
                }}
              >
                <ConversationList
                  conversations={conversationsSnapshot.conversations}
                  isLoading={conversationsSnapshot.isLoading}
                  activeConversationId={
                    conversationsSnapshot.activeConversationId
                  }
                  onSelect={id => {
                    chatPageRef.current?.selectConversation(id);
                    closeConversationsPopover();
                  }}
                  onNewConversation={handleNewConversation}
                  onDelete={id => chatPageRef.current?.deleteConversation(id)}
                  // m14 (#9010 review): this docked popover is a PRIMARY surface for the
                  // conversation rail, not a secondary one -- it gets the same rename/bulk-delete
                  // affordances the inline rail already has, routed through the same imperative
                  // handle `onDelete` above already uses.
                  onRename={(id, title) =>
                    chatPageRef.current?.renameConversation(id, title)
                  }
                  onBulkDelete={ids =>
                    chatPageRef.current?.bulkDeleteConversations(ids)
                  }
                  displayMode='flyout'
                  // The header's own icon buttons above cover both: no reason to repeat a
                  // "Conversations" title or a second "New conversation" button inside the popover.
                  showHeader={false}
                  showNewConversationButton={false}
                />
              </EuiPanel>
            </EuiPopover>
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
            ref={chatPageRef}
            core={core}
            history={chatHistory}
            providers={providers}
            providersLoaded={providersLoaded}
            providersError={providersError}
            selectedProviderId={selectedProviderId}
            onProviderChange={setSelectedProviderId}
            onNavigateToSettings={openSettingsToAddProvider}
            // Plain Settings visit (iteration-4 item 2's "Manage providers" footer item) — the
            // same `openSettings` callback the panel's own settings toolbar button already uses,
            // rather than a second hardcoded `#/settings` navigateToApp call.
            onManageProviders={openSettings}
            onGeneratingChange={handleGeneratingChange}
            onConversationsChange={setConversationsSnapshot}
            // The saved-conversations UI now lives entirely in the header's own popover above —
            // ChatPage's inline rail/collapsed-strip/flyout would be a second, redundant way to
            // reach the same conversations from inside this same docked panel.
            showConversationSidebar={false}
            // This panel's own width (`SIDEBAR_MIN_PANEL_WIDTH` above) routinely sits inside
            // ChatPage's flyout band (600-900px) — an `EuiFlyout` there would cover the WHOLE
            // dashboard, opening from the right, just to show a left-hand rail, out of a docked
            // sidecar the user never asked to leave. Capped at the collapsed strip instead; see
            // ChatPage's own `allowRailFlyout` doc comment. Moot today (the rail is always hidden
            // above), kept as a safe default should this panel ever stop passing
            // `showConversationSidebar={false}`.
            allowRailFlyout={false}
            // Same "no room for theatre" reasoning, different decision (see ChatPage's own
            // `enableWelcomeComposer` doc comment): the full page can afford to centre the
            // greeting, composer and example cards as one group and dock the composer on the first
            // send, but this sidecar is a narrow column whose composer must simply be where the
            // user last left it. Opting out keeps today's always-docked composer here, with no
            // centred state and no transition.
            enableWelcomeComposer={false}
          />
        </div>
      </div>
    </section>
  );
};
