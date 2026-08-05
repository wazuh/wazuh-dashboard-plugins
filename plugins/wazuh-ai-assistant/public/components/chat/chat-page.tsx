import './chat-page.scss';
import React, { useEffect, useRef, useState } from 'react';
import {
  EuiSpacer,
  EuiEmptyPrompt,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiIconTip,
  EuiText,
  EuiLoadingSpinner,
  EuiPanel,
  EuiIcon,
  EuiSelect,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { AppMountParameters, CoreStart } from '../../../../../src/core/public';
import { ChatService } from '../../services/chat-service';
import {
  AssistantSettings,
  SettingsService,
} from '../../services/settings-service';
import { healManagerSession } from '../../services/session-heal';
import { confirmInterruption } from '../../services/interrupt-confirm';
import { ConversationsService } from '../../services/conversations-service';
import {
  ChatMessage,
  ChatRequest,
  PersistedChatMessage,
  ConversationRecord,
  ConversationSummary,
  ProviderSummary,
  PseudonymEntry,
  TableSpec,
  ToolCall,
} from '../../../common/types';
import { mergeConversationMessages } from '../../../common/conversation-merge';
import { getHttpErrorStatus } from '../../../common/http-status';
import { restoreAndClearDraft, stashDraft } from '../../../common/draft-stash';
import {
  buildConversationRoute,
  parseConversationRoute,
  readLastConversationId,
  writeLastConversationId,
} from '../../../common/conversation-location';
import {
  AssistantTurnRecord,
  buildConversationTitle,
  buildOutgoingMessages,
  detectManagerAuthError,
  detectNavigationType,
  nextMessageId,
  reconstructConversation,
  reconstructUiMessages,
  toPersistedMessages,
} from '../../../common/chat-history';
import { MessageList } from './message-list';
import { UiChatMessage } from './message-bubble';
import { createDiscoverUrlResolver } from './discover-link';
import { createSecurityAnalyticsUrlResolver } from './security-analytics-link';
import { ChatInput, ChatInputHandle } from './chat-input';
import { ConversationList } from './conversation-list';
import { StatusCallout } from './status-callout';
import { useSyncedState } from '../../hooks/use-synced-state';

interface ChatPageProps {
  core: CoreStart;
  providers: ProviderSummary[];
  providersLoaded: boolean;
  /** Set by the app shell if the provider list failed to load; shown alongside local errors. */
  providersError: string | null;
  selectedProviderId: string;
  /** Owned by the app shell (application.tsx); rendered here so the provider selector sits in the
   * chat column's own header row next to the privacy chip, instead of a separate top-level row. */
  onProviderChange: (id: string) => void;
  /** Switches the app shell to the Settings tab; wired from the top-level route state. */
  onNavigateToSettings: () => void;
  /** The app shell's router history (the same instance `<Router history={history}>` in
   * application.tsx uses) — used to read/write the open-conversation route below through
   * `history.replace` rather than the raw `window.history` API. */
  history: AppMountParameters['history'];
  /**
   * Reports whether a turn is currently generating, so the app shell's `onAppLeave` handler can warn
   * before the user navigates away from (or reloads out of) a running answer. Called on every change,
   * never on unmount — by then the turn has been abandoned anyway.
   */
  onGeneratingChange?: (generating: boolean) => void;
  /** Whether the chat view is the app shell's visible tab (default true). While hidden, the
   * conversation hash stays out of the URL so a restore can't rewrite `/settings`. */
  isActive?: boolean;
}

/**
 * The saved-conversation row one turn writes to, shared by that turn's two saves (one when the
 * question is sent, one when the answer completes) and mutated by whichever of them creates the row.
 * `null` means "not created yet"; `version` is the optimistic-concurrency token last seen for it.
 */
interface TurnConversationTarget {
  conversationId: string | null;
  version: string | undefined;
}

const CONVERSATION_MAX_WIDTH = 860;
/** Fixed width of the saved-conversations sidebar (conversation_list.tsx). */
const CONVERSATION_SIDEBAR_WIDTH = 260;

/**
 * Welcome-state example questions, now rendered as EuiCards (not plain badge chips) so the empty
 * state reads as a real product surface: one short title + icon per card, the full question as
 * the card description. Clicking a card only fills the input (existing `setInputText` behavior),
 * it does not auto-send, matching how the previous badge chips behaved.
 */
const EXAMPLE_CARDS = [
  {
    id: 'criticalAlerts',
    icon: 'alert',
    title: i18n.translate(
      'wazuhAiAssistant.chat.example.criticalAlerts.title',
      {
        defaultMessage: 'Critical findings',
      },
    ),
    question: i18n.translate('wazuhAiAssistant.chat.example.criticalAlerts', {
      defaultMessage: 'Show me the critical findings of the last 24 hours',
    }),
  },
  {
    id: 'disconnectedAgents',
    icon: 'user',
    title: i18n.translate(
      'wazuhAiAssistant.chat.example.disconnectedAgents.title',
      {
        defaultMessage: 'Disconnected agents',
      },
    ),
    question: i18n.translate(
      'wazuhAiAssistant.chat.example.disconnectedAgents',
      {
        defaultMessage: 'Which agents are disconnected?',
      },
    ),
  },
  {
    id: 'bruteForce',
    icon: 'lock',
    title: i18n.translate('wazuhAiAssistant.chat.example.bruteForce.title', {
      defaultMessage: 'Brute force attempts',
    }),
    question: i18n.translate('wazuhAiAssistant.chat.example.bruteForce', {
      defaultMessage: 'Any brute force attempts today?',
    }),
  },
];

/**
 * Single injected `<style>` element for this whole chat surface (rendered once from ChatPage's
 * own JSX below) — the hard constraint here is EUI/inline styles + AT MOST ONE `<style>` tag for
 * exactly what inline styles cannot express: `@keyframes`, the hero wash's `radial-gradient`,
 * `:hover`/`:focus-visible` pseudo-class rules, and the example cards' per-card stagger delay
 * (each card sets `--wzCardDelay` inline; this is the one place that consumes it).
 *
 * Every color reference here is `rgba(var(--wzAccentRgb), alpha)` — `--wzAccentRgb` is set ONCE,
 * inline, on this component's own root element below, resolved from the real OSD theme
 * (`core.uiSettings.get('theme:darkMode')`, not `prefers-color-scheme`, which is NOT how OSD
 * models dark mode). Custom properties inherit through the whole DOM subtree regardless of
 * component boundaries, so every descendant (sidebar rows, hero cards) picks it up without any of
 * them needing an `isDarkMode` prop threaded down.
 *
 * Motion is entirely opt-in: every animation/transition/transform lives inside the
 * `prefers-reduced-motion: no-preference` block. Outside it (i.e. for a reduced-motion user), the
 * hero cards and message rows simply render at their final `opacity: 1` state with no movement —
 * the ONE exception is the hover/focus border+shadow rule, which is an instant state change (no
 * transition, no transform) even for reduced-motion users, since EUI's own hover affordances work
 * the same way.
 */
const CHAT_SURFACE_STYLES = `
.wzHeroCard:hover,
.wzHeroCard:focus-visible {
  border-color: rgba(var(--wzAccentRgb), 0.55) !important;
  box-shadow: 0 6px 20px -4px rgba(var(--wzAccentRgb), 0.28);
}

@media (prefers-reduced-motion: no-preference) {
  .wzHeroCard {
    opacity: 0;
    animation: wzFadeUp 420ms ease-out both;
    animation-delay: var(--wzCardDelay, 0ms);
    transition: transform 150ms ease-out, box-shadow 150ms ease-out, border-color 150ms ease-out;
  }

  .wzHeroCard:hover {
    transform: translateY(-3px);
  }

  .wzConvoRow {
    transition: background-color 120ms ease-out, border-color 120ms ease-out;
  }

  .wzMsgRow {
    opacity: 0;
    animation: wzFadeUp 260ms ease-out both;
  }

  @keyframes wzFadeUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

`;

/**
 * Rewrites the route to address `conversationId` (a `/conversation/:id` path, or `/` for none),
 * without touching the query string. Goes through the app shell's own router `history` (rather than
 * a raw `window.history.replaceState` call) so this and the shell's tab routing share one writer of
 * location changes; `replace`, not `push`, so opening a conversation never adds its own back-button
 * stop. Note this DOES notify the shell's `<Route>` (and any other `history.listen` subscriber) on
 * every call, unlike the raw DOM API it replaces — harmless here since nothing there reacts
 * differently to a `/conversation/:id` path (the shell's redirect fallback and tab matching both
 * treat it as Chat), but worth knowing if something is ever added that does. Swallows failures: some
 * embedding contexts restrict History API access, and losing the shareable URL is a UX regression,
 * not a functional one — the sessionStorage pointer still covers a reload.
 */
function replaceConversationRoute(
  history: AppMountParameters['history'],
  conversationId: string | null,
): void {
  try {
    const { search } = history.location;
    history.replace({
      pathname: buildConversationRoute(conversationId),
      search,
    });
  } catch {
    // Intentionally ignored, see above.
  }
}

export const ChatPage: React.FC<ChatPageProps> = ({
  core,
  providers,
  providersLoaded,
  providersError,
  selectedProviderId,
  onProviderChange,
  onNavigateToSettings,
  history,
  onGeneratingChange,
  isActive = true,
}) => {
  // `useSyncedState` (public/hooks/use-synced-state.ts) is the `[value, setValue, ref]` pattern
  // used for `messages`, `inputText`, and `activeConversationId` below — see that hook's own doc
  // comment for the one consolidated explanation of WHY each needs a ref mirror synced on every
  // set (persistConversationAfterTurn reads `messagesRef.current`, handleSessionExpired reads
  // `inputTextRef.current`, both from inside an async callback rather than a fresh render).
  const [messages, updateMessages, messagesRef] = useSyncedState<
    UiChatMessage[]
  >([]);
  const [inputText, setInputText, inputTextRef] = useSyncedState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persistent conversations (server/routes/conversations.ts). `activeConversationId` is
  // `null` for a brand-new, never-yet-saved conversation; `activeConversationIdRef` mirrors it the
  // same synchronous way `messagesRef` mirrors `messages`, for the same reason (read from inside
  // an async stream's completion handler without waiting on a re-render).
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [
    activeConversationId,
    setActiveConversationId,
    activeConversationIdRef,
  ] = useSyncedState<string | null>(null);
  // Save serialization: every auto-save is chained onto this promise instead of being dropped when
  // one is already in flight. Dropping an overlap was safe only while every save targeted the
  // conversation on screen (the next turn's save would resend the same, fuller array) — it is NOT
  // safe now that an abandoned turn saves a DIFFERENT conversation than the active one (see
  // `persistConversationTurn`): dropping that save would silently lose the answer the user
  // navigated away from, which is exactly what this is meant to preserve.
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [conversationsService] = useState(
    () => new ConversationsService(core.http),
  );

  // Optimistic concurrency: this tab's last-known saved-object `version` for whatever
  // conversation is currently active — `undefined` for a brand-new, never-yet-saved conversation.
  // A ref (not state): only ever read/written from `persistConversationAfterTurn`'s save path,
  // never rendered directly. Reset alongside `activeConversationId` in `handleNewConversation` and
  // `handleSelectConversation`.
  const conversationVersionRef = useRef<string | undefined>(undefined);
  // Shown after a 409 version conflict was reconciled (or failed to reconcile) on the last
  // auto-save — see `saveConversationWithMerge` below. Reset whenever the user starts a fresh save
  // attempt (`handleSend`) or switches conversations, same lifecycle as `error`/`managerAuthHint`.
  const [mergeNotice, setMergeNotice] = useState<'merged' | 'conflict' | null>(
    null,
  );

  // Privacy mode. `assistantSettings` is loaded once on mount; `privacyEnabled` and
  // `pseudonymMap` are per-conversation state that lives only in this component's own useState.
  // Besides an unmount/remount, `handleNewConversation` is now the other trigger that resets
  // them — see its own doc comment for exactly what it clears vs. leaves alone.
  const [assistantSettings, setAssistantSettings] =
    useState<AssistantSettings | null>(null);
  const [privacyEnabled, setPrivacyEnabled] = useState(false);
  const [pseudonymMap, setPseudonymMap] = useState<PseudonymEntry[]>([]);
  // Set on the user's first manual toggle so the settings-driven default effect below stops
  // recomputing it (e.g. if the top-level provider selector changes later in the same session).
  const privacyTouchedRef = useRef(false);
  // Per-turn tool_call/digest bookkeeping for history reconstruction. A ref, not
  // state: consulted only when building the NEXT request's body, never rendered.
  const turnHistoryRef = useRef<AssistantTurnRecord[]>([]);

  // wz-token pre-check: set when `detectManagerAuthError` matches something
  // visible from the just-completed turn; cleared at the start of every new send so it never goes
  // stale across turns.
  const [managerAuthHint, setManagerAuthHint] = useState(false);

  // Session-expiry recovery UX (the dashboard's
  // 15-minute session TTL vs fully-quiescent idle tabs). Set on an actual 401 from either the chat
  // POST (`runChatStream`'s `auth_expired` stream event) or a conversation save
  // (`persistConversationAfterTurn`'s catch) — unlike `managerAuthHint`, which is a best-effort
  // heuristic over the MODEL's own narration, this is a genuine platform-level auth rejection, so
  // it gets its own distinct, persistent (not auto-dismissed) callout with a reload action.
  const [sessionExpired, setSessionExpired] = useState(false);

  // A save failed and the conversation on screen is now ahead of what is stored. Auto-save used to
  // swallow every failure silently, so a user could keep chatting for an hour believing their
  // history was being kept when it had stopped being saved after the first rejection.
  const [saveFailed, setSaveFailed] = useState(false);

  // Conversation restore (common/conversation-location.ts): true while the conversation named by the
  // URL hash / this tab's stored pointer is being fetched on mount, so the chat shows a spinner
  // instead of flashing the welcome state and then swapping it for a transcript.
  const [isRestoringConversation, setIsRestoringConversation] = useState(false);
  // Guards the location-sync effect below from clobbering the hash it is supposed to READ on mount:
  // set once the initial restore attempt has been decided, one way or the other.
  const initialRestoreSettledRef = useRef(false);

  const [chatService] = useState(() => new ChatService(core.http.basePath));
  const [settingsService] = useState(() => new SettingsService(core.http));
  const abortControllerRef = useRef<AbortController | null>(null);
  // Turn identity. Incremented when a turn starts AND when a turn is abandoned, so
  // `runChatStream`'s own `finally` can tell whether the conversation it was streaming into is
  // still the one on screen. Without it, switching conversations mid-stream let the outgoing
  // turn's completion handler write its terminal state, its pseudonym entries and its auto-save
  // into whichever conversation the user had just opened.
  const streamGenerationRef = useRef(0);
  const chatInputRef = useRef<ChatInputHandle>(null);
  // "Open in Discover" (discover-link.tsx): built once with `core` in closure, rather than
  // threading `core` itself down through MessageList/MessageBubble/ResultTable.
  const [resolveDiscoverUrl] = useState(() => createDiscoverUrlResolver(core));
  // "Open in Security Analytics" (security-analytics-link.tsx): same rationale as above.
  const [resolveSecurityAnalyticsUrl] = useState(() =>
    createSecurityAnalyticsUrlResolver(core),
  );

  // Auto-scroll: `scrollPaneRef` is the right PANE — the conversation's ONE
  // true scroll container (it owns `overflowY: auto`; the chat column inside it is shrink-locked
  // via flex '1 0 auto', see the JSX comments, so the pane is what overflows and the scrollbar
  // sits at the pane's far edge, never inside the chat column). Standard
  // chat behavior: keep it pinned to the bottom while new content streams in, UNLESS the user has
  // deliberately scrolled up to read (then never hijack their position). `pinnedToBottomRef`
  // tracks intent via the pane's own scroll events (within ~160px of the bottom counts as
  // pinned — table renders/late images can shift a few px, an exact ===0 check would unpin
  // spuriously); `handleSend` force-repins so sending always snaps to the new turn. The effect
  // keys on `messages`, which the rAF-batched delta flush updates at most once per frame, so
  // this adds no per-token work beyond one cheap scroll assignment. This is the ONLY auto-scroll
  // mechanism — message-list.tsx's old sentinel/scrollIntoView version was removed with this fix
  // (it detected the scroll container ONCE at mount, usually before anything overflowed, so it
  // attached its "is the user near the bottom" listener to the wrong element and could fight
  // this one).
  const scrollPaneRef = useRef<HTMLDivElement | null>(null);
  const pinnedToBottomRef = useRef(true);
  const handleScrollPane = () => {
    const pane = scrollPaneRef.current;
    if (pane) {
      pinnedToBottomRef.current =
        pane.scrollHeight - pane.scrollTop - pane.clientHeight < 160;
    }
  };
  useEffect(() => {
    const pane = scrollPaneRef.current;
    if (pane && pinnedToBottomRef.current) {
      pane.scrollTop = pane.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    settingsService
      .getAssistantSettings()
      .then(setAssistantSettings)
      .catch(() => {
        // Non-fatal: privacy mode simply stays off (mirrors server/routes/chat.ts's own
        // resolvePrivacyEnabled default when nothing overrides it) and the chip below stays
        // non-interactive until a later successful load, if any. No separate error banner here —
        // it would compete with the chat error state on first paint for something that degrades
        // gracefully on its own.
      });

    // One-shot session auto-heal (mirrors settings-page.tsx's own heal wiring): a direct
    // deep link into this app never visits the main Wazuh app, so the wz-token cookie backing every
    // Manager-path tool call may be missing/expired on first paint. Fire-and-forget: the access
    // probe's `defaultApiHostId` is the only thing needed here, and any outcome (healed, not healed,
    // probe itself failed) is ignored — this never blocks or errors the chat UI, and the existing
    // `detectManagerAuthError` heuristic below still catches whatever, if anything, is left over.
    settingsService
      .getSettingsAccess()
      .then(access => {
        if (access.defaultApiHostId) {
          void healManagerSession(core.http, access.defaultApiHostId);
        }
      })
      .catch(() => {});

    // Session-expiry draft stash restore: the mirror image of `handleSessionExpired`'s
    // stash below. Runs once, on mount — the only time a stashed draft could be waiting, since it
    // is only ever written right before the "reload to sign in again" callout tells the user to
    // reload. `activeConversationIdRef.current` is always `null` this early (no conversation has
    // been selected/resumed yet), so this is really just the fallback scan in
    // `restoreAndClearDraft` doing the actual work — see that function's own doc comment for why
    // the scan (not a direct keyed lookup) is what makes restoration work across a reload at all.
    //
    // `detectNavigationType()` is passed through so
    // `restoreAndClearDraft` only actually restores something across the ONE reload the "session
    // expired" callout itself solicited — every other mount of this component (a plain
    // Chat<->Settings tab switch, a fresh page load after a same-tab logout/login) now clears any
    // stashed draft instead of potentially handing it to whoever is looking at the screen.
    try {
      const restored = restoreAndClearDraft(
        window.sessionStorage,
        activeConversationIdRef.current,
        detectNavigationType(),
      );
      if (restored) {
        setInputText(restored);
      }
    } catch {
      // sessionStorage can throw in locked-down browser contexts (e.g. some private-browsing
      // configurations) — losing the draft stash is a UX regression only, never a functional bug.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-conversation privacy default: resolved once settings AND a selected
  // provider are both known, and never recomputed after the user's first manual toggle — switching
  // providers mid-conversation does not retroactively change an already-chosen value.
  useEffect(() => {
    if (
      !assistantSettings ||
      !selectedProviderId ||
      privacyTouchedRef.current
    ) {
      return;
    }
    const perProviderDefault =
      assistantSettings.privacyDefaultPerProvider[selectedProviderId];
    setPrivacyEnabled(perProviderDefault ?? assistantSettings.privacyDefaultOn);
  }, [assistantSettings, selectedProviderId]);

  const handleTogglePrivacy = () => {
    if (!assistantSettings?.userCanOverride) {
      return;
    }
    privacyTouchedRef.current = true;
    // Applies from the NEXT message only: toggling just changes what handleSend reads on its next
    // call — nothing about already-sent turns is rewritten.
    setPrivacyEnabled(current => !current);
  };

  /**
   * Stop button: cancels the provider stream but keeps the turn ATTACHED to the conversation on
   * screen — the generation counter is deliberately not bumped, so `runChatStream`'s `finally`
   * still takes its normal path (terminal state committed to the visible bubble, auto-save adopted
   * into the active conversation). Whatever streamed in before the stop is kept, exactly as
   * before.
   */
  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  };

  useEffect(() => {
    onGeneratingChange?.(isGenerating);
  }, [isGenerating, onGeneratingChange]);

  /**
   * Gate for any action that would throw away a running answer: asks first instead of silently
   * cancelling. Passing through untouched when nothing is generating is what keeps the common case
   * a single click.
   *
   * Covers the in-app moves (opening another conversation, starting a new one), through the SAME
   * `overlays.openConfirm` dialog the platform shows when the user leaves the app entirely — see
   * services/interrupt-confirm.ts for why this is not a locally rendered modal. Switching to the
   * Settings TAB deliberately asks nothing: that no longer interrupts anything, the answer keeps
   * streaming into the Chat tab.
   */
  const confirmIfGenerating = async (proceed: () => void) => {
    if (!isGenerating) {
      proceed();
      return;
    }
    if (await confirmInterruption(core.overlays)) {
      proceed();
    }
  };

  /**
   * Cancels the in-flight turn AND detaches it from this component's live state: the user is
   * leaving the conversation that turn belongs to (conversation switch, new conversation, deleting
   * the active one, or unmount). Bumping the generation counter is what makes `runChatStream`'s
   * `finally` take its abandoned path — it persists the turn to the conversation it actually
   * started in, and touches no state belonging to whatever the user opened next.
   *
   * Resetting `isGenerating` here (rather than leaving it to that `finally`, which will no longer
   * do it for an abandoned turn) is what unblocks the newly opened conversation's input: the abort
   * only settles a microtask later, and the abandoned path must not flip shared UI state at all.
   */
  const abandonActiveStream = () => {
    if (!abortControllerRef.current) {
      return;
    }
    streamGenerationRef.current += 1;
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
  };

  /**
   * Session-expiry recovery UX: called on a genuine 401 from either the chat POST or a
   * conversation save. Stashes whatever the user currently has typed (via `inputTextRef`, not
   * `inputText` — see that ref's own doc comment for why) before showing the persistent callout,
   * so `window.location.reload()` never silently discards it. Idempotent: calling this again while
   * the callout is already showing just re-stashes the (possibly since-edited) draft under the
   * same key.
   */
  const handleSessionExpired = () => {
    setSessionExpired(true);
    try {
      stashDraft(
        window.sessionStorage,
        activeConversationIdRef.current,
        inputTextRef.current,
      );
    } catch {
      // As above: sessionStorage failures here are a lost-draft UX regression, never fatal.
    }
  };

  // Persistent conversations: load the caller's own saved-conversation list once on mount.
  // `refreshConversations` is also called after every create/update/delete below so the sidebar
  // stays in sync without a full remount.
  const refreshConversations = () => {
    setIsLoadingConversations(true);
    conversationsService
      .list()
      .then(setConversations)
      .catch(() => {
        // Non-fatal: the sidebar just stays empty/stale — the main chat still works without it,
        // and the next successful refreshConversations() call (e.g. after the next save) recovers.
      })
      .finally(() => setIsLoadingConversations(false));
  };

  useEffect(() => {
    refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Loads a saved conversation into the live chat. Shared by the sidebar's resume handler and by the
   * mount-time restore below — the difference is only what each does around it (aborting an
   * in-flight turn, showing a spinner, reacting to a conversation that no longer exists).
   *
   * The pseudonym map and `turnHistoryRef` both reset: a resumed conversation has no client-held
   * pseudonym state to resume (server/saved_objects/conversation.ts's PRIVACY INTERACTION doc
   * comment: the map is wire-only and never persisted) and no stored tool_call/digest pairs to
   * replay as history either.
   */
  const applyLoadedConversation = (record: ConversationRecord) => {
    // A resumed conversation opens at its latest turn (bottom), like every chat client.
    pinnedToBottomRef.current = true;
    const restored = reconstructConversation(record.messages);
    updateMessages(restored.messages);
    // Restoring the tool history is what makes a resumed conversation continuable rather than just
    // readable: the model gets back the tool calls whose results its prose describes, instead of
    // re-running the same queries on the next question.
    turnHistoryRef.current = restored.turnRecords;
    setPseudonymMap([]);
    setActiveConversationId(record.id);
    // Optimistic concurrency: this tab's last-known version starts at whatever the GET returned —
    // the baseline its NEXT save's `expectedVersion` is checked against.
    conversationVersionRef.current = record.version;
    setError(null);
    setManagerAuthHint(false);
    setMergeNotice(null);
  };

  /**
   * Mount-time conversation restore: the open conversation used to live ONLY in this component's
   * state, so a reload, a deep link, or coming back from another dashboard app landed on an empty
   * chat with no way to tell which conversation the user had been in — and the next turn then
   * created a second saved conversation instead of continuing theirs.
   *
   * The URL route wins over this tab's stored pointer, so a pasted/bookmarked link always opens what
   * it names. A conversation that is simply GONE (deleted in another tab, or pruned by the retention
   * policy, which deletes on access) is not an error worth a banner: the pointer is forgotten and the
   * user gets a clean new conversation, exactly as if they had never had one open. Any OTHER failure
   * keeps the pointer (the conversation is probably still there; the request just failed) and
   * surfaces the same load error the sidebar's own resume path uses.
   */
  useEffect(() => {
    const restoreId =
      parseConversationRoute(history.location.pathname) ??
      readLastConversationId(window.sessionStorage);
    if (!restoreId) {
      initialRestoreSettledRef.current = true;
      return;
    }
    setIsRestoringConversation(true);
    conversationsService
      .get(restoreId)
      .then(record => {
        initialRestoreSettledRef.current = true;
        applyLoadedConversation(record);
      })
      .catch(restoreError => {
        initialRestoreSettledRef.current = true;
        const status = getHttpErrorStatus(restoreError);
        if (status === 404 || status === 403) {
          writeLastConversationId(window.sessionStorage, null);
          if (isActive) {
            replaceConversationRoute(history, null);
          }
          return;
        }
        setError(
          i18n.translate('wazuhAiAssistant.chat.conversations.loadError', {
            defaultMessage: 'Could not load that conversation.',
          }),
        );
      })
      .finally(() => setIsRestoringConversation(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Keeps the two out-of-band records of "which conversation is open" in step with state, so the
   * next reload/deep link can restore it. `history.replace` (not `push`) because opening a
   * conversation is not a navigation the back button should have to walk back through turn by turn.
   *
   * The route is only written while the view is visible (`isActive`), and re-synced when it becomes
   * visible again — a restore running behind Settings must not rewrite `/settings` (#8820).
   *
   * Skipped until the mount-time restore above has settled — otherwise this effect's very first run
   * would overwrite the route it is supposed to read.
   */
  useEffect(() => {
    if (!initialRestoreSettledRef.current) {
      return;
    }
    writeLastConversationId(window.sessionStorage, activeConversationId);
    if (isActive) {
      replaceConversationRoute(history, activeConversationId);
    }
  }, [activeConversationId, isActive, history]);

  // Unmount cleanup: the app shell (application.tsx) now KEEPS this component mounted across a
  // Chat<->Settings tab switch, so unmount means the user really left the app (another dashboard
  // app, a reload, a logout) — without this that orphans the in-flight SSE stream instead of
  // cancelling it. `abandonActiveStream` (not a bare abort) so the
  // turn's `finally` persists what streamed in to the conversation it belongs to instead of
  // writing terminal state into a component that no longer exists. Empty deps with no exhaustive-
  // deps exemption needed: everything `abandonActiveStream` touches is a ref or a stable setter,
  // so the first render's closure stays correct for the whole component lifetime.
  useEffect(() => () => abandonActiveStream(), []);

  /**
   * New conversation: resets messages AND the pseudonym map — fresh privacy state — plus
   * the digest-in-history bookkeeping (`turnHistoryRef`, meaningless
   * without the messages it was built for) and `activeConversationId` (so the NEXT auto-save
   * creates a new saved-conversation row instead of overwriting the one just left). Deliberately
   * leaves `privacyEnabled`/`privacyTouchedRef` and the selected provider untouched — those are
   * session-level choices, not per-conversation ones, per this component's existing convention.
   *
   * Abandons any in-flight turn first: it belongs to the conversation being left, and every
   * `updateMessages` call it still has queued targets a message id that no longer exists in the
   * list this replaces it with.
   */
  const handleNewConversation = () => {
    abandonActiveStream();
    pinnedToBottomRef.current = true;
    updateMessages([]);
    turnHistoryRef.current = [];
    setPseudonymMap([]);
    setActiveConversationId(null);
    // Optimistic concurrency: a brand-new conversation has no server version to conflict with
    // yet — the next auto-save creates it with a POST.
    conversationVersionRef.current = undefined;
    setError(null);
    setManagerAuthHint(false);
    setMergeNotice(null);
  };

  /**
   * Resume a saved conversation from the sidebar: loads its full transcript and replaces the live
   * chat with it (`applyLoadedConversation`, shared with the mount-time restore above).
   */
  const handleSelectConversation = async (id: string) => {
    if (id === activeConversationIdRef.current) {
      return;
    }
    try {
      const record = await conversationsService.get(id);
      // Abandon the in-flight turn only once the switch is certain to happen — after the GET
      // resolved, immediately before the message list is replaced. Aborting before the await would
      // throw away a running answer even when the load fails and the user stays put.
      abandonActiveStream();
      applyLoadedConversation(record);
    } catch {
      setError(
        i18n.translate('wazuhAiAssistant.chat.conversations.loadError', {
          defaultMessage: 'Could not load that conversation.',
        }),
      );
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await conversationsService.remove(id);
      if (activeConversationIdRef.current === id) {
        handleNewConversation();
      }
      refreshConversations();
    } catch {
      setError(
        i18n.translate('wazuhAiAssistant.chat.conversations.deleteError', {
          defaultMessage: 'Could not delete that conversation.',
        }),
      );
    }
  };

  /**
   * PUT with optimistic concurrency and merge-on-conflict (two tabs on the SAME conversation
   * previously last-write-wins, silently erasing the
   * faster tab's turns). Sends `expectedVersion` (the caller's last-known version for THIS
   * conversation — the active conversation's `conversationVersionRef`, or the version captured when
   * an abandoned turn started); the server 409s when another tab's write landed first
   * (server/routes/conversations.ts).
   *
   * `reflectInUi` is false when saving a conversation the user has already navigated away from: a
   * merge outcome for a conversation that is no longer on screen must not replace the visible
   * message list, reset this tab's tool-history bookkeeping, or raise a notice about a conversation
   * the user is no longer looking at.
   *
   * On a 409: fetches the server's current copy, merges it with THIS tab's own local messages via
   * the longest-common-prefix merge (common/conversation-merge.ts — "server messages, then this
   * tab's own messages after the shared history"), and retries the save ONCE with the fresh
   * version. On success, the merged transcript is reflected back into the live UI (`updateMessages`
   * below) so what is on screen matches what was just persisted, and a non-blocking notice tells
   * the user their tab was reconciled with another one.
   *
   * If the retry ALSO 409s (a third write raced in during reconciliation), this gives up rather
   * than looping: it re-throws so the caller's catch treats it like any other failed save (no
   * further retry until the next completed turn), and this tab's own `messages` state is left
   * completely untouched — the user never loses what they see, even though it may not be what is
   * currently persisted server-side. A `getHttpErrorStatus(...) === 401` is deliberately NOT
   * handled here (re-thrown untouched): that is the session-expiry path's concern, not a version conflict, and
   * `persistConversationAfterTurn`'s own catch below is what reacts to it.
   */
  const saveConversationWithMerge = async (
    id: string,
    title: string,
    localMessages: PersistedChatMessage[],
    expectedVersion: string | undefined,
    reflectInUi: boolean,
  ): Promise<ConversationRecord> => {
    try {
      return await conversationsService.update(
        id,
        title,
        localMessages,
        expectedVersion,
      );
    } catch (firstError) {
      if (getHttpErrorStatus(firstError) !== 409) {
        throw firstError;
      }
    }

    // 409: reconcile against whatever the server has right now.
    const serverRecord = await conversationsService.get(id);
    const merged = mergeConversationMessages(
      serverRecord.messages,
      localMessages,
    );
    try {
      const retried = await conversationsService.update(
        id,
        title,
        merged,
        serverRecord.version,
      );
      if (reflectInUi) {
        setMergeNotice('merged');
        updateMessages(reconstructUiMessages(merged));
        // The reconstructed messages above have fresh ids that don't match anything in
        // turnHistoryRef's bookkeeping (built for THIS tab's own assistantMessageIds) — clearing it
        // is the same reset `handleSelectConversation` already does after any wholesale message-list
        // replacement, so a later turn's digest-in-history resend doesn't try to look up a
        // now-nonexistent id.
        turnHistoryRef.current = [];
      }
      return retried;
    } catch (retryError) {
      if (reflectInUi && getHttpErrorStatus(retryError) === 409) {
        setMergeNotice('conflict');
      }
      throw retryError;
    }
  };

  /**
   * Auto-save, called from `runChatStream`'s `finally` after EVERY turn — including a turn the user
   * navigated away from mid-stream, which is why the conversation being written is an explicit
   * argument rather than read from `activeConversationIdRef` in here.
   *
   * `adoptAsActive` distinguishes the two callers. True for the turn the user is still watching:
   * the created id and the returned version become this component's active conversation state, the
   * same as before. False for an ABANDONED turn: its transcript is still persisted (that is the
   * whole point — the answer the user walked away from is not lost), but nothing about this
   * component's live state is touched, so it cannot overwrite the id/version of whatever
   * conversation is now on screen. An abandoned turn with no `conversationId` yet gets its own new
   * row via POST, so a partial first answer still shows up in the sidebar instead of vanishing.
   *
   * Serialized through `saveQueueRef` rather than dropped on overlap — see that ref's own comment.
   *
   * `target` is the row this TURN writes to, and it is mutable: a turn now saves twice (once when
   * the question is sent, once when the answer completes), and the first of those may be what
   * creates the conversation. Both saves share one target, so the second updates the row the first
   * created instead of creating a second one — which is exactly what happened while the target was
   * a plain id captured before the stream started.
   */
  const persistConversationTurn = (args: {
    target: TurnConversationTarget;
    messages: UiChatMessage[];
    turnRecords: AssistantTurnRecord[];
    adoptAsActive: boolean;
  }): Promise<void> => {
    const task = async () => {
      if (args.messages.length === 0) {
        return;
      }
      const { target, turnRecords } = args;
      const conversationId = target.conversationId;
      // Prefer the component's live version while this still IS the conversation on screen: a merge
      // or another save may have moved it on since the target was created.
      const expectedVersion =
        args.adoptAsActive && activeConversationIdRef.current === conversationId
          ? conversationVersionRef.current
          : target.version;
      try {
        // The untitled-fallback label is resolved here (not inside buildConversationTitle, which is
        // now a dependency-free common/ helper — see its own doc comment) via the same
        // i18n.translate call this file always made for it.
        const title = buildConversationTitle(
          args.messages,
          i18n.translate('wazuhAiAssistant.chat.conversations.untitled', {
            defaultMessage: 'Untitled conversation',
          }),
        );
        const toPersist = toPersistedMessages(args.messages, turnRecords);
        if (conversationId) {
          const record = await saveConversationWithMerge(
            conversationId,
            title,
            toPersist,
            expectedVersion,
            args.adoptAsActive,
          );
          // Only when this IS still the active conversation: an adopted save that raced with a
          // conversation switch must not stamp its version onto the newly opened one.
          if (
            args.adoptAsActive &&
            activeConversationIdRef.current === conversationId
          ) {
            conversationVersionRef.current = record.version;
          }
          target.version = record.version;
        } else {
          const created = await conversationsService.create(title, toPersist);
          // The turn now owns this row: its later saves update it instead of creating another.
          target.conversationId = created.id;
          target.version = created.version;
          if (args.adoptAsActive && activeConversationIdRef.current === null) {
            setActiveConversationId(created.id);
            conversationVersionRef.current = created.version;
          }
        }
        refreshConversations();
        if (args.adoptAsActive) {
          setSaveFailed(false);
        }
      } catch (persistError) {
        // Session-expiry recovery UX: a conversation save can 401 the same way the chat POST
        // can (same dashboard session, same 15-minute TTL) — this is the "and from the conversation
        // save" half of that fix; the chat POST's own 401 is handled in runChatStream's event loop.
        if (getHttpErrorStatus(persistError) === 401) {
          handleSessionExpired();
          return;
        }
        // The chat itself keeps working — the transcript on screen is intact and the next turn's
        // save retries with the full message list — but the user is TOLD, because "your history
        // stopped being saved" is not something to discover later. Only for the conversation on
        // screen: a notice about a conversation the user already left would be unactionable.
        if (args.adoptAsActive) {
          setSaveFailed(true);
        }
      }
    };
    // `task` handles its own errors, so the queue can never be poisoned by a rejected link.
    saveQueueRef.current = saveQueueRef.current.then(task, task);
    return saveQueueRef.current;
  };

  /**
   * Stream-consuming core for a user turn (`handleSend`): consumes the SSE stream and commits
   * every event into the assistant bubble identified by `assistantMessageId`.
   */
  const runChatStream = async (args: {
    assistantMessageId: string;
    /** The full UI message list this turn started from, INCLUDING its own (still empty) assistant
     * placeholder. Kept as a local copy so the turn can reconstruct its own complete transcript in
     * `finally` without reading React state — which, for an abandoned turn, has already been
     * replaced by whatever conversation the user opened next. */
    baseMessages: UiChatMessage[];
    /** The row this turn saves to, already carrying the active conversation's id (or `null` for one
     * that does not exist yet) and shared with the pre-send save `handleSend` fired. */
    target: TurnConversationTarget;
    outgoingMessages: ChatMessage[];
    privacyPayload: ChatRequest['privacy'];
  }) => {
    const {
      assistantMessageId,
      baseMessages,
      target,
      outgoingMessages,
      privacyPayload,
    } = args;

    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    streamGenerationRef.current += 1;
    const generation = streamGenerationRef.current;
    /** False once this turn has been abandoned (`abandonActiveStream`) or superseded by a newer
     * one — every write into shared component state is gated on it. */
    const isTurnStillActive = () => generation === streamGenerationRef.current;
    // This turn's own tool-call record, held by reference rather than looked up per event: the
    // `tool_call`/`digest` handlers below used to search `turnHistoryRef` by assistant message id,
    // which finds nothing once the ref has been reset by a conversation switch — so an abandoned
    // turn's tool exchanges were dropped instead of saved with it.
    const turnRecord = turnHistoryRef.current.find(
      turn => turn.assistantMessageId === assistantMessageId,
    );

    // Empty-table suppression: an empty `table` event is held back (not
    // committed to `message.table`) instead of rendered immediately, since a failed/empty first
    // tool attempt followed by a successful retry's table in the SAME turn should show only the
    // later, real one. Flushed (shown) if the stream ends before anything replaces it — "keep a
    // single empty table if it's the only one" (honest-empty stays correct). A plain local
    // variable, not a ref/state: scoped to this one stream's sequential event loop only.
    let pendingEmptyTable: TableSpec | undefined;
    /**
     * A non-empty `table` event held back until the answer's first text arrives. The server emits
     * `table` the moment a tool returns, well before the model has narrated anything, so committing
     * it immediately made the table pop in first and the prose then grow in above it — the bubble
     * renders the table UNDER the text (message-bubble.tsx), so the turn read backwards while it
     * streamed. Released by `flushPendingDelta` together with that first text (one React update, so
     * text and table appear at once), or on its own by `flushPendingTable` if the turn ends, errors,
     * or expires before any text arrives — an answer that is only a table must still show it.
     */
    let pendingTable: TableSpec | undefined;
    /** The tool calls issued this turn, in order — mirrors what the bubble displays so the abandoned
     * path can rebuild the turn without reading React state. */
    let committedToolCalls: ToolCall[] = [];
    /** The table this turn will be remembered with — mirrors what the flushes below commit to
     * React state, so the abandoned path can rebuild the turn without reading that state. */
    let committedTable: TableSpec | undefined;
    const flushPendingEmptyTable = () => {
      if (!pendingEmptyTable) {
        return;
      }
      const spec = pendingEmptyTable;
      pendingEmptyTable = undefined;
      committedTable = spec;
      if (!isTurnStillActive()) {
        return;
      }
      updateMessages(current =>
        current.map(message =>
          message.id === assistantMessageId
            ? { ...message, table: spec }
            : message,
        ),
      );
    };
    /** Commits a held non-empty table on its own, for the turns where no answer text ever arrives to
     * pair it with (stream ended, errored, or the session expired). A no-op once `flushPendingDelta`
     * has already released it. */
    const flushPendingTable = () => {
      if (!pendingTable) {
        return;
      }
      const spec = pendingTable;
      pendingTable = undefined;
      committedTable = spec;
      if (!isTurnStillActive()) {
        return;
      }
      updateMessages(current =>
        current.map(message =>
          message.id === assistantMessageId
            ? { ...message, table: spec }
            : message,
        ),
      );
    };

    // wz-token pre-check: accumulated locally (not read back from React state)
    // so `detectManagerAuthError` can be checked once the stream ends, over exactly the text THIS
    // stream produced.
    let accumulatedContent = '';
    /**
     * Whether this turn reached a terminal state of its own — a `done` frame, or an `error`/
     * `auth_expired` that has already been reported. Anything else means the stream simply STOPPED:
     * Stop was pressed, the user navigated away, or the connection dropped. That case used to be
     * indistinguishable from a finished answer, so a truncated response was saved and later resumed
     * as though it were complete.
     */
    let turnCompleted = false;

    // Delta batching (typing-lag/streaming-jank fix): a fast-streaming provider can
    // emit a `delta` event per token, and without batching EVERY one committed its own React state
    // update (its own MessageList/MessageBubble/ResultTable re-render pass). `pendingDeltaText`
    // buffers consecutive delta text locally; `flushPendingDelta` is the only place that ever
    // commits it to `message.content`, via a SINGLE `updateMessages` call, scheduled at most once
    // per animation frame (`flushScheduled` guards against scheduling a second one while one is
    // already pending). This is local to this one stream call, not a ref persisted across renders
    // — a `let`/const closure is enough since nothing outside this function ever reads it.
    let pendingDeltaText = '';
    let flushScheduled = false;
    const flushPendingDelta = () => {
      flushScheduled = false;
      if (!pendingDeltaText) {
        return;
      }
      const text = pendingDeltaText;
      pendingDeltaText = '';
      // The first text of the answer is what the held table was waiting for: released in this same
      // update so the bubble shows text and table together, already in their final order.
      const table = pendingTable;
      pendingTable = undefined;
      if (table) {
        committedTable = table;
      }
      // An abandoned turn keeps accumulating into `accumulatedContent` (which is what its own
      // transcript is rebuilt from) but stops writing into the message list, which now belongs to
      // a different conversation.
      if (!isTurnStillActive()) {
        return;
      }
      updateMessages(current =>
        current.map(message =>
          message.id === assistantMessageId
            ? // Real content is arriving: drop any stale "querying..." status line.
              {
                ...message,
                content: message.content + text,
                statusMessage: undefined,
                ...(table ? { table } : {}),
              }
            : message,
        ),
      );
    };
    const scheduleFlush = () => {
      if (flushScheduled) {
        return;
      }
      flushScheduled = true;
      // requestAnimationFrame caps the commit rate to the display's own refresh rate (typically
      // ~16ms), which is both smoother and cheaper than a fixed timeout; a plain setTimeout is the
      // fallback for any non-browser environment (e.g. a future SSR/test context) where rAF isn't
      // defined.
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(flushPendingDelta);
      } else {
        setTimeout(flushPendingDelta, 80);
      }
    };

    try {
      for await (const event of chatService.streamChat(
        selectedProviderId,
        outgoingMessages,
        controller.signal,
        privacyPayload,
      )) {
        // Ordering invariant: every non-delta event must observe `message.content` as it stands
        // AFTER every delta text that arrived strictly before it — flushing here (a no-op if
        // nothing is pending) guarantees that regardless of where the batched flush would
        // otherwise have landed.
        if (event.type !== 'delta') {
          flushPendingDelta();
        }
        if (event.type === 'delta') {
          accumulatedContent += event.content;
          pendingDeltaText += event.content;
          scheduleFlush();
        } else if (event.type === 'table') {
          if (event.spec.rows.length === 0) {
            pendingEmptyTable = event.spec;
          } else {
            pendingEmptyTable = undefined;
            // Held rather than committed — see `pendingTable`. `committedTable` is deliberately NOT
            // set here: it is set at the moment the table actually reaches the message list, so an
            // abandoned turn is remembered with exactly what it displayed.
            pendingTable = event.spec;
          }
        } else if (event.type === 'status' && isTurnStillActive()) {
          // Transient progress line (e.g. "Querying Wazuh...") from the orchestration loop; no
          // engine emits this yet, but the bubble already knows how to show it once one does.
          updateMessages(current =>
            current.map(message =>
              message.id === assistantMessageId
                ? { ...message, statusMessage: event.message }
                : message,
            ),
          );
        } else if (event.type === 'tool_call') {
          // Digest-in-history bookkeeping only — never rendered as a UI message (message_bubble.tsx
          // has no bubble type for it; it lives in this turn's record until a LATER turn's
          // buildOutgoingMessages call resends it, or until the turn is saved).
          turnRecord?.toolExchanges.push({ toolCall: event.toolCall });
          // Also surfaced in the bubble (message-bubble.tsx's collapsed "queries executed" panel),
          // so the reader can check the query behind the answer as it runs.
          committedToolCalls = [...committedToolCalls, event.toolCall];
          if (isTurnStillActive()) {
            const toolCallsForDisplay = committedToolCalls;
            updateMessages(current =>
              current.map(message =>
                message.id === assistantMessageId
                  ? { ...message, toolCalls: toolCallsForDisplay }
                  : message,
              ),
            );
          }
        } else if (event.type === 'digest') {
          const exchange = turnRecord?.toolExchanges.find(
            entry => entry.toolCall.id === event.toolCallId,
          );
          if (exchange) {
            exchange.digestContent = event.content;
          }
        } else if (event.type === 'privacy_map' && isTurnStillActive()) {
          // Gated: the pseudonym map is PER-CONVERSATION state. An abandoned turn's entries used to
          // be merged into whatever conversation the user had just opened, and then sent up with
          // that conversation's next request.
          setPseudonymMap(current => {
            const known = new Set(current.map(entry => entry.pseudonym));
            const additions = event.entries.filter(
              entry => !known.has(entry.pseudonym),
            );
            return additions.length > 0 ? [...current, ...additions] : current;
          });
        } else if (event.type === 'done') {
          turnCompleted = true;
        } else if (event.type === 'error') {
          turnCompleted = true;
          flushPendingEmptyTable();
          // Released before the placeholder cleanup below, which drops an assistant message with
          // neither content nor table — a turn whose tool succeeded and whose narration then failed
          // must keep the table it already produced.
          flushPendingTable();
          if (!isTurnStillActive()) {
            // An error banner for a conversation the user already left is pure noise — the turn's
            // own transcript (rebuilt in `finally`) simply carries whatever streamed in before it.
            continue;
          }
          if (detectManagerAuthError(event.message)) {
            setManagerAuthHint(true);
          } else {
            setError(event.message);
          }
          // Drop the assistant placeholder if no content ever arrived for it; keep it if
          // partial deltas (or a table) already streamed in before the error happened.
          updateMessages(current =>
            current.filter(
              message =>
                !(
                  message.id === assistantMessageId &&
                  message.content === '' &&
                  !message.table
                ),
            ),
          );
        } else if (event.type === 'auth_expired') {
          // Session-expiry recovery UX: a genuine 401 on the chat POST itself, distinct
          // from the generic `error` branch above — same placeholder-cleanup, but a dedicated,
          // persistent callout instead of the free-form error banner. Unlike the branch above this
          // is NOT gated on the turn still being active: the session is gone for the whole app, so
          // the callout is just as relevant to whatever conversation is now on screen.
          turnCompleted = true;
          flushPendingTable();
          flushPendingEmptyTable();
          handleSessionExpired();
          if (!isTurnStillActive()) {
            continue;
          }
          updateMessages(current =>
            current.filter(
              message =>
                !(
                  message.id === assistantMessageId &&
                  message.content === '' &&
                  !message.table
                ),
            ),
          );
        }
      }
    } finally {
      // Flush order matches the loop's own invariant above: any buffered delta text lands before
      // the empty-table flush and the final `isStreaming: false` update below, whether the stream
      // ended normally, errored, or was aborted (handleStop's `controller.abort()` unwinds the
      // `for await` and lands here the same way).
      flushPendingDelta();
      // A turn that produced a table but never any prose (the model stopped after the tool call, or
      // Stop was pressed while it was still thinking) still has to show that table.
      flushPendingTable();
      flushPendingEmptyTable();

      if (!isTurnStillActive()) {
        // Abandoned turn: the user switched conversation, started a new one, or left the app while
        // this was streaming. Persist what it produced to the conversation it actually belongs to,
        // rebuilt from this turn's OWN local record (`baseMessages` + `accumulatedContent` +
        // `committedTable`) rather than from React state, which now describes a different
        // conversation. Nothing here touches shared state — `abandonActiveStream` already reset
        // `isGenerating` and `abortControllerRef` at the moment of abandonment.
        const abandonedTranscript = baseMessages
          .map(message =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: accumulatedContent,
                  table: committedTable,
                  ...(committedToolCalls.length > 0
                    ? { toolCalls: committedToolCalls }
                    : {}),
                  isStreaming: false,
                  ...(turnCompleted ? {} : { interrupted: true }),
                }
              : message,
          )
          // Same rule the `error` branch applies to the visible list: an assistant placeholder that
          // never received anything is not worth persisting.
          .filter(
            message =>
              !(
                message.id === assistantMessageId &&
                message.content === '' &&
                !message.table
              ),
          );
        void persistConversationTurn({
          adoptAsActive: false,
          target,
          messages: abandonedTranscript,
          // `turnHistoryRef` has already been reset to whatever conversation the user opened
          // instead, so this turn's own record is passed explicitly.
          turnRecords: turnRecord ? [turnRecord] : [],
        });
      } else {
        if (detectManagerAuthError(accumulatedContent)) {
          setManagerAuthHint(true);
        }
        updateMessages(current =>
          current.map(message =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  isStreaming: false,
                  ...(turnCompleted ? {} : { interrupted: true }),
                }
              : message,
          ),
        );
        setIsGenerating(false);
        abortControllerRef.current = null;
        chatInputRef.current?.focus();
        // Auto-save: fire-and-forget — `persistConversationTurn` handles its own errors (no
        // separate banner) and is handed `messagesRef.current`, which the `isStreaming: false`
        // update just above already applied synchronously (see `useSyncedState`'s doc comment).
        void persistConversationTurn({
          adoptAsActive: true,
          target,
          messages: messagesRef.current,
          turnRecords: turnHistoryRef.current,
        });
      }
    }
  };

  // Privacy: omit the whole `privacy` key when it would be `{enabled:false, map:[]}` — i.e. a
  // conversation that has never enabled privacy mode and never minted a pseudonym. The route
  // treats an absent key and a disabled one identically, so sending nothing keeps the request
  // body minimal for the common case.
  const privacyPayload =
    privacyEnabled || pseudonymMap.length > 0
      ? { enabled: privacyEnabled, map: pseudonymMap }
      : undefined;

  /**
   * Runs one assistant turn over `history`, whose LAST message must be the user message being
   * answered. Shared by `handleSend` (which appends a new question) and `handleRetryLastTurn` (which
   * re-answers the existing last question after dropping the interrupted answer), so both go through
   * exactly the same placeholder/history/save/stream sequence.
   */
  const startTurn = async (history: UiChatMessage[]) => {
    const assistantMessageId = nextMessageId();
    const assistantMessage: UiChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      createdAt: Date.now(),
    };

    // Built from turnHistoryRef BEFORE this turn's own (still-empty) record is registered below, so
    // it only ever reflects PRIOR completed turns — see buildOutgoingMessages's doc comment.
    const outgoingMessages = buildOutgoingMessages(
      history,
      turnHistoryRef.current,
    );
    turnHistoryRef.current = [
      ...turnHistoryRef.current,
      { assistantMessageId, toolExchanges: [] },
    ];

    // Sending always snaps the pane to the new turn, even if the user had scrolled up — the one
    // case where overriding their scroll position is what they expect (see pinnedToBottomRef).
    pinnedToBottomRef.current = true;
    const baseMessages = [...history, assistantMessage];
    updateMessages(baseMessages);

    // Persist the question BEFORE generating, not only after the turn completes. A reload, a
    // navigation, or a crash mid-answer used to lose the question too — the conversation was only
    // created once the turn ended, so the user came back to an empty chat with no trace that they
    // had asked anything. `history` excludes the still-empty assistant placeholder. Both of this
    // turn's saves share `target`, so whichever runs first creates the row and the other updates it
    // — see `TurnConversationTarget`.
    const target: TurnConversationTarget = {
      conversationId: activeConversationIdRef.current,
      version: conversationVersionRef.current,
    };
    void persistConversationTurn({
      adoptAsActive: true,
      target,
      messages: history,
      turnRecords: turnHistoryRef.current,
    });

    await runChatStream({
      assistantMessageId,
      baseMessages,
      target,
      outgoingMessages,
      privacyPayload,
    });
  };

  const handleSend = async (text: string) => {
    if (!selectedProviderId) {
      setError(
        i18n.translate('wazuhAiAssistant.chat.noProviderError', {
          defaultMessage:
            'Configure a provider in the Settings tab before starting a chat.',
        }),
      );
      return;
    }

    setError(null);
    setManagerAuthHint(false);
    setMergeNotice(null);
    setSessionExpired(false);
    setSaveFailed(false);
    await startTurn([
      ...messages,
      {
        id: nextMessageId(),
        role: 'user',
        content: text,
        createdAt: Date.now(),
      },
    ]);
  };

  /**
   * Re-asks the question whose answer was interrupted. The interrupted answer is dropped from the
   * transcript first, so the retry replaces it rather than appending a second answer to the same
   * question — and the pre-send save then persists the conversation without it, which is what makes
   * a retried turn look like one turn after a reload too.
   *
   * Only ever offered for the LAST message (message-list.tsx) and only while nothing is generating,
   * so there is no case where this rewrites the middle of a conversation.
   */
  const handleRetryLastTurn = async () => {
    const last = messages[messages.length - 1];
    if (isGenerating || !last) {
      return;
    }
    // Two shapes of unfinished turn. An interrupted ASSISTANT message is the one this tab marked
    // itself (Stop, or leaving while the page stayed alive). A trailing USER message is the harder
    // case: a reload or a navigation killed the page mid-answer, so nothing was left running to mark
    // anything — the question was saved before generating started and that is all there is.
    const isInterruptedAnswer =
      last.role === 'assistant' && last.interrupted === true;
    if (!isInterruptedAnswer && last.role !== 'user') {
      return;
    }
    const history = isInterruptedAnswer ? messages.slice(0, -1) : messages;
    if (history[history.length - 1]?.role !== 'user') {
      return;
    }
    // The dropped answer's tool exchanges go with it: they belong to a turn that is being replaced.
    turnHistoryRef.current = turnHistoryRef.current.filter(
      turn => turn.assistantMessageId !== last.id,
    );
    setError(null);
    setManagerAuthHint(false);
    setSaveFailed(false);
    updateMessages(history);
    await startTurn(history);
  };

  const hasProviders = providers.length > 0;
  const showNoProviderState = providersLoaded && !hasProviders;
  // Initial mount, before the app shell's provider load has resolved either way: neither the
  // no-provider nor the welcome state can render yet (both depend on `providersLoaded`), so without
  // an explicit state here this window shows a blank pane. Restoring a conversation shows the same
  // spinner, so a reload lands on "loading" and then the transcript, instead of flashing the
  // welcome state at a user who is not starting from scratch.
  const showLoadingState = !providersLoaded || isRestoringConversation;
  const showWelcomeState =
    hasProviders && messages.length === 0 && !showLoadingState;

  const privacyBadgeLabel = privacyEnabled
    ? i18n.translate('wazuhAiAssistant.chat.privacy.on', {
        defaultMessage: 'On',
      })
    : i18n.translate('wazuhAiAssistant.chat.privacy.off', {
        defaultMessage: 'Off',
      });
  const privacyBadgeIcon = privacyEnabled ? 'lock' : 'lockOpen';
  const privacyBadge = assistantSettings?.userCanOverride ? (
    <EuiButtonEmpty
      size='s'
      color={privacyEnabled ? 'success' : 'text'}
      iconType={privacyBadgeIcon}
      onClick={handleTogglePrivacy}
    >
      {privacyBadgeLabel}
    </EuiButtonEmpty>
  ) : (
    <EuiButtonEmpty
      size='s'
      color={privacyEnabled ? 'success' : 'text'}
      iconType={privacyBadgeIcon}
      isDisabled
    >
      {privacyBadgeLabel}
    </EuiButtonEmpty>
  );

  // The badge alone only ever said
  // "on"/"off" with no explanation of what that actually does to the user's data. This is the
  // chat-page half of that disclosure — the concrete field categories are named once here and
  // once more in the admin Settings page description (settings-page.tsx); wording intentionally
  // matches between the two.
  const privacyExplainerText = privacyEnabled
    ? i18n.translate('wazuhAiAssistant.chat.privacy.explainOn', {
        defaultMessage:
          'Privacy on: hostnames, IP addresses, usernames, process command lines, and finding/rule text are pseudonymized before being sent to the configured AI provider.',
      })
    : i18n.translate('wazuhAiAssistant.chat.privacy.explainOff', {
        defaultMessage:
          'Privacy off: hostnames, IP addresses, usernames, process command lines, and finding/rule text are sent to the configured AI provider as-is.',
      });

  const providerOptions = providers.map(provider => ({
    value: provider.id,
    text: provider.isDefault
      ? i18n.translate('wazuhAiAssistant.chat.providerOptionDefault', {
          defaultMessage: '{name} (default)',
          values: { name: provider.name },
        })
      : provider.name,
  }));

  // Theme-correct accent (see CHAT_SURFACE_STYLES's doc comment): OSD dark mode is a uiSettings
  // toggle the dashboard applies on a full page load, not a live-changing media feature, so
  // reading it once per render — no listener, no state — is enough. This is the same #0077CC
  // family conversation-list.tsx's selected and hover rows use, lightened for dark mode so it
  // stays legible against a dark canvas instead of reading as a second, unrelated hue.
  const isDarkMode = core.uiSettings.get('theme:darkMode');
  const accentRgb = isDarkMode ? '86, 180, 233' : '0, 119, 204';

  return (
    // Iteration 2 layout: EuiPage/EuiPageSideBar rendered as an unreliable hairline sliver in this
    // OSD/EUI build (iteration 1 screenshots), so the two-pane layout is now an explicit,
    // deterministic flex row instead of relying on EuiPageSideBar's own internal layout. `height:
    // '100%'` is a no-op (resolves to `auto`, i.e. natural content height) unless an ancestor in
    // application.tsx / the OSD app-mount chain supplies a bounded height, which is the normal OSD
    // app-mount pattern (html/body/#osdApp height:100% chain) but was NOT verified by running the
    // app here — application.tsx itself sets no height anywhere (EuiTabs + EuiSpacer + this
    // component in plain document flow). If that chain turns out NOT to be bounded, this simply
    // behaves like the old plain document-flow layout (sidebar and chat column both size to
    // content, page scrolls normally) rather than breaking, so it is safe either way.
    <>
      {/* Single injected <style> element for the whole chat surface — see CHAT_SURFACE_STYLES's own
        doc comment above for exactly what it does and does not cover. */}
      <style>{CHAT_SURFACE_STYLES}</style>
      <div
        style={
          {
            display: 'flex',
            height: '100%',
            minHeight: 0,
            // Consumed by CHAT_SURFACE_STYLES above and by inline `rgba(var(--wzAccentRgb), ...)`
            // reads further down this subtree (conversation-list.tsx's selected/hover rows, the
            // hero cards' icon chips) — set once here so nothing downstream needs its own
            // isDarkMode prop.
            '--wzAccentRgb': accentRgb,
          } as React.CSSProperties
        }
      >
        {/* Left pane: saved-conversations sidebar. EuiPanel color="subdued" gives the standard OSD
          "sunken" pane background without inventing a new hardcoded color. */}
        <EuiPanel
          color='subdued'
          hasShadow={false}
          hasBorder={false}
          borderRadius='none'
          paddingSize='m'
          // EuiPanel's `grow` prop DEFAULTS TO TRUE (flex-grow:1), which in this flex-row parent
          // overrode the fixed width below and let the sidebar swallow half the page. A
          // fixed-width pane must explicitly opt out.
          grow={false}
          style={{
            width: CONVERSATION_SIDEBAR_WIDTH,
            maxWidth: CONVERSATION_SIDEBAR_WIDTH,
            flexShrink: 0,
            overflowY: 'auto',
            // Single hardcoded hex in this file: #D3DAE6 is EUI's `lightShade` token, the same shade
            // EUI's own components already use for hairline borders in the light theme. No CSS
            // variable/theme value is exposed to inline styles in this plugin (no stylesheet, no
            // EuiThemeProvider hook usage elsewhere here), so this is a deliberate one-off rather than
            // a new arbitrary color.
            borderRight: '1px solid #D3DAE6',
          }}
        >
          <ConversationList
            conversations={conversations}
            isLoading={isLoadingConversations}
            activeConversationId={activeConversationId}
            // Both go through the confirm gate: each would cancel a running answer. Delete is not
            // gated — ConversationList already confirms it, and a second modal on top of that one
            // would be worse than the risk it guards against.
            //
            // Clicking the conversation ALREADY open is not one of those actions: it is a no-op
            // (`handleSelectConversation` returns immediately), so asking to confirm an interruption
            // that was never going to happen only trains the user to dismiss the dialog. The check
            // has to happen here, before the gate, not only inside the handler behind it.
            onSelect={id => {
              if (id === activeConversationIdRef.current) {
                return;
              }
              void confirmIfGenerating(() => void handleSelectConversation(id));
            }}
            onNewConversation={() =>
              void confirmIfGenerating(handleNewConversation)
            }
            onDelete={handleDeleteConversation}
          />
        </EuiPanel>

        {/* Right pane: the chat column, centered, on the plain (default) background. This IS the
          conversation's scroll container (the scrollbar belongs
          at the pane's far edge like any chat app, never inside the chat column — and it should
          only EXIST once the content actually overflows, no permanently reserved gutter, so
          overflowY 'auto' with no scrollbarGutter). The auto-scroll pinning refs above target it;
          overflowAnchor keeps Chrome's scroll anchoring from fighting the pinning while answers
          stream (cast: React 16's CSSProperties predates that property). */}
        <div
          ref={scrollPaneRef}
          onScroll={handleScrollPane}
          style={
            {
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              // Welcome state: the column stays content-sized (see its flex below) and THIS centers
              // the whole compact cluster (hero + cards + input) vertically.
              justifyContent: showWelcomeState ? 'center' : 'flex-start',
              overflowY: 'auto',
              overflowAnchor: 'none',
            } as React.CSSProperties
          }
        >
          {/* Column flex is state-dependent: in the WELCOME state it is
            content-sized ('0 0 auto') so the hero/cards/input read as one compact centered
            cluster (the pane's justifyContent above does the vertical centering) — growing it
            stretched the cards and dropped the input to the screen bottom.
            In a CONVERSATION it is '1 0 auto': grow fills the pane when short (input rests at the
            bottom), and shrink 0 stops flex from SQUEEZING this column when the conversation
            outgrows the pane — the old default shrink made the middle section collapse and the
            messages visibly spill past the input, mid-thread. With shrink 0 the column simply
            grows and the PANE scrolls (edge scrollbar), while the sticky input keeps itself in
            view. */}
          {/* Pane-centered in BOTH states (the earlier
            welcome-only viewport-centering transform read as "leaning left with an empty right
            band" on wide monitors — removed; the pane's alignItems centering is the only
            horizontal centering now). */}
          <div
            style={{
              maxWidth: CONVERSATION_MAX_WIDTH,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              flex: showWelcomeState ? '0 0 auto' : '1 0 auto',
              minHeight: 0,
              padding: '16px 24px 0',
            }}
          >
            {(error || providersError) && (
              <StatusCallout
                title={i18n.translate('wazuhAiAssistant.chat.errorTitle', {
                  defaultMessage: 'Something went wrong',
                })}
                color='danger'
                iconType='alert'
                body={error ?? providersError}
              />
            )}

            {managerAuthHint && (
              <StatusCallout
                title={i18n.translate(
                  'wazuhAiAssistant.chat.managerAuthHint.title',
                  {
                    defaultMessage: 'Your Wazuh session may have expired',
                  },
                )}
                color='warning'
                iconType='alert'
                body={i18n.translate(
                  'wazuhAiAssistant.chat.managerAuthHint.body',
                  {
                    defaultMessage:
                      'A request to the Wazuh manager failed, which can happen when your dashboard session token has expired. Reload the page and sign in again, then retry your question.',
                  },
                )}
              />
            )}

            {/* Session-expiry recovery UX: a genuine 401, distinct from managerAuthHint's
                  best-effort heuristic above. Persistent (no dismiss control, and nothing in this
                  file ever calls setSessionExpired(false) except starting a fresh send) until the
                  user reloads, per this fix's brief. */}
            {sessionExpired && (
              <StatusCallout
                title={i18n.translate(
                  'wazuhAiAssistant.chat.sessionExpired.title',
                  {
                    defaultMessage: 'Your session expired',
                  },
                )}
                color='danger'
                iconType='lock'
                body={i18n.translate(
                  'wazuhAiAssistant.chat.sessionExpired.body',
                  {
                    defaultMessage:
                      'Reload the page to sign in again. Your unsent message has been saved and will be restored automatically.',
                  },
                )}
                action={
                  <EuiButton
                    size='s'
                    color='danger'
                    onClick={() => window.location.reload()}
                  >
                    {i18n.translate(
                      'wazuhAiAssistant.chat.sessionExpired.reloadButton',
                      {
                        defaultMessage: 'Reload page',
                      },
                    )}
                  </EuiButton>
                }
              />
            )}

            {/* Optimistic-concurrency notice: shown after persistConversationAfterTurn's
                  auto-save hit a 409 on the last completed turn — see saveConversationWithMerge's
                  own doc comment for exactly when each variant fires. Non-blocking: the chat itself
                  is fully usable either way, this is purely informational. */}
            {mergeNotice === 'merged' && (
              <StatusCallout
                title={i18n.translate(
                  'wazuhAiAssistant.chat.conversations.mergedNotice.title',
                  {
                    defaultMessage: 'Conversation merged',
                  },
                )}
                color='warning'
                iconType='alert'
                body={i18n.translate(
                  'wazuhAiAssistant.chat.conversations.mergedNotice.body',
                  {
                    defaultMessage:
                      'This conversation was also updated in another tab — the versions were merged.',
                  },
                )}
              />
            )}

            {mergeNotice === 'conflict' && (
              <StatusCallout
                title={i18n.translate(
                  'wazuhAiAssistant.chat.conversations.mergeConflictNotice.title',
                  {
                    defaultMessage: 'Could not merge automatically',
                  },
                )}
                color='warning'
                iconType='alert'
                body={i18n.translate(
                  'wazuhAiAssistant.chat.conversations.mergeConflictNotice.body',
                  {
                    defaultMessage:
                      'This conversation is being edited in another tab and the changes could not be merged automatically. Your latest messages are still shown here, but they may not be saved.',
                  },
                )}
              />
            )}

            {/* A failed auto-save is surfaced instead of swallowed: the conversation on screen is
                ahead of what is stored, which the user cannot infer from anything else. Not
                dismissible and not an action — the next turn's save retries on its own, and clears
                this as soon as one succeeds. */}
            {saveFailed && (
              <StatusCallout
                title={i18n.translate(
                  'wazuhAiAssistant.chat.conversations.saveFailed.title',
                  {
                    defaultMessage: 'This conversation is not being saved',
                  },
                )}
                color='warning'
                iconType='alert'
                body={i18n.translate(
                  'wazuhAiAssistant.chat.conversations.saveFailed.body',
                  {
                    defaultMessage:
                      'The latest messages could not be saved, so they may be missing if you reload. The chat still works, and saving is retried after each answer.',
                  },
                )}
              />
            )}

            {showLoadingState && (
              <EuiFlexGroup
                justifyContent='center'
                alignItems='center'
                style={{ minHeight: 240 }}
              >
                <EuiFlexItem grow={false}>
                  <EuiLoadingSpinner
                    size='xl'
                    aria-label={i18n.translate(
                      'wazuhAiAssistant.common.loading',
                      {
                        defaultMessage: 'Loading...',
                      },
                    )}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            )}

            {showNoProviderState && (
              <EuiEmptyPrompt
                iconType='machineLearningApp'
                title={
                  <h2>
                    {i18n.translate('wazuhAiAssistant.chat.noProvider.title', {
                      defaultMessage: 'No AI provider configured',
                    })}
                  </h2>
                }
                body={
                  <p>
                    {i18n.translate('wazuhAiAssistant.chat.noProvider.body', {
                      defaultMessage:
                        'The AI Assistant needs at least one connected provider (OpenAI-compatible or Anthropic) before it can answer questions. Add one to get started.',
                    })}
                  </p>
                }
                actions={
                  <EuiButton
                    color='primary'
                    fill
                    onClick={onNavigateToSettings}
                  >
                    {i18n.translate('wazuhAiAssistant.chat.noProvider.action', {
                      defaultMessage: 'Add a provider',
                    })}
                  </EuiButton>
                }
              />
            )}

            {/* Middle section: grows to push the input to the pane's bottom on short
                  conversations, and simply carries the message flow on long ones — the PANE (not
                  this div) is the scroll container, so no scrollbar ever renders inside the chat
                  column (the column's own flex '1 0 auto' shrink-lock is
                  what prevents the old spill-past-the-input bug, see its comment above). In the
                  welcome state it becomes a centered flex column so the empty prompt sits in the
                  vertical middle of the available space. */}
            <div
              style={
                showWelcomeState
                  ? {
                      flex: '1 1 auto',
                      minHeight: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }
                  : { flex: '1 1 auto', minHeight: 0 }
              }
            >
              {showWelcomeState && (
                <>
                  <EuiEmptyPrompt
                    // No `icon`: this chat already lives inside the Wazuh app chrome, so a Wazuh
                    // mark on the welcome screen only repeated branding the user can already see.
                    title={
                      // Inline size/weight/letter-spacing override the EuiEmptyPrompt title's
                      // own (smaller) default — inline style always wins over EUI's class-based
                      // font-size here, same override pattern already used throughout this file.
                      <h2
                        style={{
                          fontSize: 30,
                          fontWeight: 600,
                          letterSpacing: '-0.01em',
                          lineHeight: 1.25,
                          margin: 0,
                        }}
                      >
                        {i18n.translate('wazuhAiAssistant.chat.welcome.title', {
                          defaultMessage: 'Ask the AI Assistant something',
                        })}
                      </h2>
                    }
                    body={
                      <p style={{ fontSize: 16, lineHeight: 1.5, margin: 0 }}>
                        {i18n.translate(
                          'wazuhAiAssistant.chat.welcome.subtitle',
                          {
                            defaultMessage:
                              'Ask questions about your security data in plain language.',
                          },
                        )}
                      </p>
                    }
                  />
                  <EuiSpacer size='l' />
                  {/* Same existing "Try one of these..." string, now reads as a small
                        section label introducing the cards rather than a second full
                        paragraph competing with the subtitle above. Moved out of
                        EuiEmptyPrompt's body (along with the card row below) so the row is
                        no longer clamped to the empty prompt's ~576px content width — it now
                        spans the full ~860px chat column instead of wrapping 2+1. */}
                  <EuiText size='s' color='subdued'>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                        fontSize: 11,
                        textAlign: 'center',
                      }}
                    >
                      {i18n.translate('wazuhAiAssistant.chat.welcome.body', {
                        defaultMessage:
                          'Try one of these, or type your own question below.',
                      })}
                    </p>
                  </EuiText>
                  <EuiSpacer size='s' />
                  {/* Elevated example cards (EuiPanel, not EuiCard): a titleSize="xs"-style
                        compact EuiCard is not a reliably typed prop in this EUI version and
                        EuiCard's fixed layout paddings still read oversized at "s"/horizontal
                        for a 3-up row this narrow, so this uses onClick EuiPanels instead —
                        icon chip + title + one truncated line, now with a consistent height,
                        a hover lift (wzHeroCard, see CHAT_SURFACE_STYLES), and a staggered
                        fade/slide-in on mount driven by each card's own --wzCardDelay.
                        Clicking still only fills the input (unchanged setInputText call),
                        never auto-sends. */}
                  <EuiFlexGroup
                    gutterSize='m'
                    wrap
                    justifyContent='center'
                    responsive={false}
                  >
                    {EXAMPLE_CARDS.map((card, index) => (
                      <EuiFlexItem
                        grow={1}
                        key={card.id}
                        style={{ minWidth: 220, maxWidth: 280 }}
                      >
                        <EuiPanel
                          paddingSize='m'
                          hasShadow={false}
                          hasBorder
                          onClick={() => setInputText(card.question)}
                          className='wzHeroCard'
                          style={
                            {
                              textAlign: 'left',
                              height: '100%',
                              minHeight: 128,
                              display: 'flex',
                              flexDirection: 'column',
                              borderRadius: 10,
                              // Consumed only by CHAT_SURFACE_STYLES's reduced-motion-safe
                              // animation-delay rule; see this component's own doc comment.
                              '--wzCardDelay': `${index * 80}ms`,
                            } as React.CSSProperties
                          }
                        >
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: 'rgba(var(--wzAccentRgb), 0.12)',
                            }}
                          >
                            <EuiIcon
                              type={card.icon}
                              size='m'
                              color='primary'
                            />
                          </div>
                          <EuiSpacer size='s' />
                          <EuiText size='s'>
                            <strong>{card.title}</strong>
                          </EuiText>
                          <EuiText size='xs' color='subdued'>
                            <p
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                margin: '2px 0 0',
                              }}
                            >
                              {card.question}
                            </p>
                          </EuiText>
                        </EuiPanel>
                      </EuiFlexItem>
                    ))}
                  </EuiFlexGroup>
                  <EuiSpacer size='l' />
                </>
              )}

              {!showLoadingState &&
                !showNoProviderState &&
                !showWelcomeState && (
                  <MessageList
                    messages={messages}
                    resolveDiscoverUrl={resolveDiscoverUrl}
                    resolveSecurityAnalyticsUrl={resolveSecurityAnalyticsUrl}
                    // Withheld while generating: retrying would abandon the turn already running.
                    onRetryLastTurn={
                      isGenerating ? undefined : handleRetryLastTurn
                    }
                  />
                )}
            </div>

            {!showLoadingState && !showNoProviderState && (
              <div className='wzStickyInputPanel'>
                <EuiSpacer size='xs' />
                <EuiPanel
                  color='plain'
                  hasBorder
                  hasShadow={false}
                  paddingSize='s'
                  style={{ borderRadius: 12, marginBottom: 12 }}
                >
                  <ChatInput
                    ref={chatInputRef}
                    value={inputText}
                    onChange={setInputText}
                    disabled={!hasProviders}
                    isGenerating={isGenerating}
                    onSend={handleSend}
                  />
                  <EuiSpacer size='xs' />
                  <EuiFlexGroup
                    alignItems='center'
                    gutterSize='s'
                    responsive={false}
                    wrap
                  >
                    {hasProviders && assistantSettings && (
                      <EuiFlexItem grow={false}>
                        {assistantSettings.userCanOverride ? (
                          privacyBadge
                        ) : (
                          <EuiToolTip
                            content={i18n.translate(
                              'wazuhAiAssistant.chat.privacy.adminSet',
                              { defaultMessage: 'Set by administrator' },
                            )}
                          >
                            {privacyBadge}
                          </EuiToolTip>
                        )}
                      </EuiFlexItem>
                    )}
                    {hasProviders && assistantSettings && (
                      <EuiFlexItem grow={false}>
                        <EuiIconTip
                          type='iInCircle'
                          color='subdued'
                          content={privacyExplainerText}
                          aria-label={i18n.translate(
                            'wazuhAiAssistant.chat.privacy.explainAriaLabel',
                            {
                              defaultMessage:
                                'What privacy mode does to your data',
                            },
                          )}
                        />
                      </EuiFlexItem>
                    )}
                    <EuiFlexItem />
                    {hasProviders && (
                      <EuiFlexItem grow={false}>
                        <EuiSelect
                          id='wzAiAssistantProviderSelect'
                          compressed
                          prepend={i18n.translate(
                            'wazuhAiAssistant.chat.providerLabel',
                            { defaultMessage: 'Provider' },
                          )}
                          options={providerOptions}
                          value={selectedProviderId}
                          onChange={event =>
                            onProviderChange(event.target.value)
                          }
                          aria-label={i18n.translate(
                            'wazuhAiAssistant.chat.providerSelect',
                            { defaultMessage: 'Provider' },
                          )}
                        />
                      </EuiFlexItem>
                    )}
                    <EuiFlexItem grow={false}>
                      {isGenerating ? (
                        <EuiButtonIcon
                          iconType='cross'
                          color='danger'
                          size='s'
                          onClick={handleStop}
                          aria-label={i18n.translate(
                            'wazuhAiAssistant.chat.stopButton',
                            { defaultMessage: 'Stop' },
                          )}
                        />
                      ) : (
                        <EuiButtonIcon
                          iconType='arrowUp'
                          color='primary'
                          size='s'
                          display='fill'
                          onClick={() => chatInputRef.current?.send()}
                          disabled={!hasProviders || !inputText.trim()}
                          aria-label={i18n.translate(
                            'wazuhAiAssistant.chat.sendButton',
                            { defaultMessage: 'Send' },
                          )}
                        />
                      )}
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
                <EuiText size='xs' color='subdued' textAlign='center'>
                  <p>
                    {i18n.translate('wazuhAiAssistant.chat.disclaimer', {
                      defaultMessage:
                        'AI responses may contain errors. Always verify critical information.',
                    })}
                  </p>
                </EuiText>
                <EuiSpacer size='s' />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
