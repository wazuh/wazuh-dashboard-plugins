import './chat-page.scss';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  EuiSpacer,
  EuiEmptyPrompt,
  EuiButton,
  EuiBadge,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIconTip,
  EuiText,
  EuiTitle,
  EuiScreenReaderOnly,
  EuiCard,
  EuiLoadingSpinner,
  EuiPanel,
  EuiIcon,
  EuiFlyout,
  EuiFlyoutBody,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { AppMountParameters, CoreStart } from '../../../../../src/core/public';
import { ChatService } from '../../services/chat-service';
import {
  AssistantSettings,
  SettingsService,
} from '../../services/settings-service';
import { ensureManagerSession } from '../../services/session-heal';
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
import { ProviderPicker } from './provider-picker';
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
  /** The no-provider empty state's "Add a provider" CTA — its only caller. Owners wire it to
   * open Settings with the create-provider flyout (`#/settings?addProvider=true`). */
  onNavigateToSettings: () => void;
  /** The provider picker's (chat-page.tsx, `ProviderPicker`) "Manage providers" footer item — a
   * plain visit to the Settings app, deliberately a SEPARATE callback from `onNavigateToSettings`
   * above rather than a reuse of it: that one always opens the create-provider flyout
   * (`?addProvider=true`), which is the wrong behaviour for a reader who already has providers
   * configured and just wants the table. Each embedding context wires this to the SAME helper it
   * already uses for a plain Settings visit — application.tsx's tab-switch
   * `navigateTo('settings')`, assistant-chat-panel.tsx's `openSettings` — rather than a new
   * hardcoded path. */
  onManageProviders: () => void;
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
  /** Whether to render the saved-conversations sidebar (default true). The docked header panel
   * (assistant-chat-panel.tsx) hides it while the panel is too narrow for both panes. */
  showConversationSidebar?: boolean;
  /**
   * Whether the rail is allowed to escalate to an `EuiFlyout` below `RAIL_FLYOUT_AT` (default
   * true). `EuiFlyout` is a `position: fixed` overlay that covers the WHOLE screen it's rendered
   * into — fine for the app shell's own full-page ChatPage, but the header's docked sidecar
   * (assistant-chat-panel.tsx, `SIDEBAR_MIN_PANEL_WIDTH = 600`) renders ChatPage inside a panel that
   * can itself be anywhere from 600 to 900+px wide, i.e. squarely inside the flyout band — which
   * turned "the rail is a bit narrow" into "a full-screen overlay just opened from the right to show
   * a LEFT-hand rail", covering the entire dashboard out of a sidecar the user never asked to leave.
   * An explicit prop (rather than this component sniffing its own embedding context, e.g. via
   * `showConversationSidebar` or some other side channel) is what keeps that decision the caller's
   * to make, the same way `showConversationSidebar` already is.
   */
  allowRailFlyout?: boolean;
  /**
   * Whether the empty state may render as ONE vertically centred group (greeting + composer +
   * example cards) that docks the composer to the bottom on the first send — C1, the Gemini-style
   * empty state (AI/ux-iter3/gemini-motion-spec.md). Default true, i.e. the app shell's full-page
   * chat gets it; the header's docked sidecar (assistant-chat-panel.tsx) passes `false` and keeps
   * today's always-docked composer, per the spec's own "no room for theatre" note.
   *
   * A dedicated prop rather than piggy-backing on `allowRailFlyout === false` (the only other
   * signal that currently distinguishes the sidecar): that prop answers "may the rail escalate to
   * a full-screen overlay", which is a different question with a different answer surface — a
   * future caller could well want a centred welcome AND no rail flyout, or the reverse. Same
   * reasoning `allowRailFlyout`'s own doc comment gives for not sniffing `showConversationSidebar`:
   * the embedding context is the CALLER's to declare, one explicit prop per decision.
   */
  enableWelcomeComposer?: boolean;
}

/**
 * C1 composer position state machine (chat-page.scss carries the matching classes).
 *
 * - `centered` — the empty state: the pane is a centred flex column, so the transcript (holding
 *   greeting + example cards) and the composer read as one group sitting slightly above the
 *   vertical middle, with a compact composer measure.
 * - `docking` — the one-time bridge, ~400ms: the pane is ALREADY back in its final
 *   `grid-template-rows: 1fr auto` layout (so the transcript is laid out at full height before the
 *   first user message lands in it), and the composer is carried from its old position to its new
 *   one by an inverted transform (FLIP). The welcome group fades out of flow on top.
 * - `docked` — today's layout, byte for byte: `.wzChatPane` with no modifier, no inline transform.
 *   Every other state of this component (loading, no-provider, restored conversation, and the
 *   embedded sidecar) is this one, so nothing about the existing surface depends on the machine.
 *
 * FLIP (measure → apply final layout → invert → release) rather than a pure CSS transition,
 * because the two end states differ in `display` (flex vs grid) and in track sizing (`auto` vs
 * `1fr`) — neither is interpolable, so there is no property a CSS transition could animate between
 * them. Inverting a transform on the composer row is the only mechanism that gets the final layout
 * committed immediately (which is what the transcript needs) while still showing the travel.
 */
type ComposerMode = 'centered' | 'docking' | 'docked';

/** Pane classes per mode. A map, not a nested ternary in the JSX: the docked entry has to stay
 * exactly `'wzChatPane'` (no modifier) and reading that off one table is what makes it obvious. */
const PANE_CLASS_BY_COMPOSER_MODE: Record<ComposerMode, string> = {
  centered: 'wzChatPane wzChatPane--welcome',
  docking: 'wzChatPane wzChatPane--docking',
  docked: 'wzChatPane',
};

/** Composer travel budget — the JS half of `$wzDockTravel` (chat-page.scss), which owns the actual
 * `transition-duration`. This copy exists only for the settle FALLBACK below, so the two are
 * allowed to differ slightly (the fallback is deliberately the longer of the two). */
const DOCK_TRAVEL_MS = 400;
/** `transitionend` can never be relied on alone: it does not fire when the animated property never
 * actually changes (a zero-length travel — e.g. an already-bottom composer), when the element is
 * hidden mid-flight (the sidecar's own tab switch), or in jsdom, which runs no transitions at all.
 * The timer is therefore the primary settle path and the event is the fast path. */
const DOCK_SETTLE_FALLBACK_MS = DOCK_TRAVEL_MS + 300;

/** Reduced-motion probe. `matchMedia` is absent in jsdom, so it is optional-called rather than
 * assumed; a missing implementation reads as "no preference", i.e. animate. Shared by the two
 * places that need the preference in JS instead of CSS (smooth-scrolling the transcript, and the
 * composer's dock travel) so they can never disagree. */
function prefersReducedMotion(): boolean {
  return (
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
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

/** Fixed width of the EXPANDED saved-conversations rail (conversation-list.tsx), asserted as an
 * exact inline pixel value by this file's own display-mode tests. There is genuinely no SCSS
 * counterpart for this one (unlike `$wzContentMaxWidth`, which chat-page.scss owns outright): the
 * rail's width switches on a value this component measures off its own DOM node at runtime, which
 * no CSS media/container query in this build can react to, so `$wzRailWidth` was deleted from
 * `public/components/_redesign.scss` rather than kept as an unconsumed duplicate of this number. */
const CONVERSATION_SIDEBAR_WIDTH = 260;
/** Collapsed rail strip width (contract §5 / §6) — mirrors `$wzRailCollapsedWidth`
 * (conversation-list.scss's `.wzConvoRailCollapsed` is the real SCSS consumer of that token; this
 * is the same number applied to the OUTER panel this file renders, which has no CSS class of its
 * own to read it from — same "measured at runtime" reasoning as `CONVERSATION_SIDEBAR_WIDTH`). */
const RAIL_COLLAPSED_WIDTH = 48;
/** Pane-width breakpoints for the rail's own display mode (contract §5 / §6). JS-only for the same
 * reason as the widths above — these gate an imperative branch over a measured `offsetWidth`, not a
 * CSS rule, so `$wzRailCollapseAt`/`$wzRailFlyoutAt` were deleted from `_redesign.scss` rather than
 * left as tokens nothing could ever consume. Measured against the PANE (this component's own root),
 * not the window, so an embedding context that gives this component less room (e.g. the docked
 * header panel) collapses the rail on its own. */
const RAIL_COLLAPSE_AT = 1100;
const RAIL_FLYOUT_AT = 900;
/** How close to the bottom of the transcript still counts as "following the conversation" (see
 * `pinnedToBottomRef` below). A table render or a late-arriving image can shift the pane by a few
 * pixels, so an exact `=== 0` check would unpin spuriously and stop auto-scrolling mid-answer.
 * Extracted from the two places that now read it (the pinning handler and the jump-to-latest
 * button's own visibility, which is the same predicate inverted) rather than restated. */
const SCROLL_PIN_THRESHOLD_PX = 160;
/** Extra slack before an already-pinned pane UNpins (hysteresis). The pin predicate reads
 * `clientHeight`, and anything that resizes the pane right on the pin boundary — in the audited
 * bug it was the jump button owning its own 36px grid track; any future layout could reintroduce
 * an equivalent — turns a single boundary crossing into show→resize→hide→resize flicker when both
 * directions share one threshold. Unpinning at 160+40 while re-pinning at 160 keeps the
 * predicate's output from ever feeding back into its own input. */
const SCROLL_UNPIN_SLACK_PX = 40;
/** Window event announcing a conversation create/update/delete; every mounted ChatPage listens
 * and refreshes, keeping the app shell's and the header flyout's sidebars in sync. */
export const CONVERSATIONS_CHANGED_EVENT =
  'wazuhAiAssistant:conversationsChanged';

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
    // Deliberately the shortest of the three questions rather than the longest: rendered as a card
    // description in a 3-up grid, the old "Show me the critical findings of the last 24 hours"
    // wrapped to two lines while its two neighbours took one, so the row's cards had visibly
    // different amounts of empty space in them (audit §1.6, rulebook D21).
    question: i18n.translate('wazuhAiAssistant.chat.example.criticalAlerts', {
      defaultMessage: 'Critical findings in the last 24 hours',
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
  onManageProviders,
  history,
  onGeneratingChange,
  isActive = true,
  showConversationSidebar = true,
  allowRailFlyout = true,
  enableWelcomeComposer = true,
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
  /**
   * The error MESSAGE the user dismissed, not a `boolean` flag — so what re-shows the callout is the
   * error value itself changing, with no separate reset call to keep in sync. `error` is cleared
   * (`setError(null)`) by every path that starts fresh work — a new send, a retry, switching or
   * starting a conversation — and the effect below turns that into the dismissal being dropped, so
   * the next failure surfaces even when it reports the identical message. Comparing by value rather
   * than by flag also keeps the two sources honest: dismissing a transient send error cannot
   * suppress a DIFFERENT, still-current `providersError` underneath it.
   */
  const [dismissedError, setDismissedError] = useState<string | null>(null);

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
  // Drives the saveFailed callout's "Retry now" button: true only for the duration of a
  // manually-triggered retry, so the button shows a spinner and cannot be double-clicked into a
  // second concurrent save. `persistConversationTurn` itself is already queued/serialized
  // (`saveQueueRef`), so this is purely a button-affordance guard, not a correctness one.
  const [isRetryingSave, setIsRetryingSave] = useState(false);

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

  // Height of the transcript pane, published so ResultTable can step its page size 5 -> 10 above
  // 900px (layout contract §4). MessageList/MessageBubble already thread this down; nothing was
  // measuring it, so the taller page size was unreachable. Measured rather than derived from the
  // window: the pane is what the rows have to fit inside, and it changes with the composer's own
  // height, not just with the viewport. Guarded because jsdom has no ResizeObserver — there the
  // value stays 0 and the default page size applies, which is what the existing tests expect.
  // Drops a dismissal once there is no error left to dismiss, which is what lets the SAME message
  // re-surface on the next failure (see `dismissedError`'s own comment). Hangs off the error values
  // rather than being called from each reset path — `setError(null)` already runs in five of them
  // (new send, retry-last-answer, conversation select, new conversation, provider reload), and a
  // sixth added later would silently not clear the dismissal if this were plumbed by hand.
  useEffect(() => {
    if (!error && !providersError) {
      setDismissedError(null);
    }
  }, [error, providersError]);

  const [transcriptHeightPx, setTranscriptHeightPx] = useState(0);
  useEffect(() => {
    const pane = scrollPaneRef.current;
    if (!pane || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() =>
      setTranscriptHeightPx(pane.clientHeight),
    );
    observer.observe(pane);
    setTranscriptHeightPx(pane.clientHeight);
    return () => observer.disconnect();
  }, []);
  const pinnedToBottomRef = useRef(true);
  /**
   * Render mirror of `pinnedToBottomRef`, and ONLY that: it exists so the "jump to latest" button
   * (bottom-right of the transcript row, below) can appear the moment the user scrolls up and
   * disappear the moment they are following again. The REF stays the single source of truth every
   * scroll read goes through, so the streaming path keeps costing one cheap `scrollTop` assignment
   * per flushed frame and never a re-render.
   *
   * Written only when the value actually FLIPS. A drag-scroll fires a scroll event per frame, and
   * committing an identical value on each one would trade the ref's whole reason for existing for a
   * render per frame (React would bail out of re-rendering an unchanged value, but only after the
   * state update has already been scheduled and processed).
   */
  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  /**
   * Re-pins the pane to the newest content. Every "snap back to the latest turn" caller goes
   * through this — sending a message, opening a saved conversation, starting a new one, and the
   * jump button — so the ref and its render mirror can never disagree; a stale `true` mirror would
   * leave the jump button hidden while the user sits scrolled up, and a stale `false` one would
   * leave it floating over a transcript that is already at the bottom.
   */
  const repinToBottom = () => {
    pinnedToBottomRef.current = true;
    setIsPinnedToBottom(true);
  };
  const handleScrollPane = () => {
    const pane = scrollPaneRef.current;
    if (!pane) {
      return;
    }
    const distance = pane.scrollHeight - pane.scrollTop - pane.clientHeight;
    // Hysteresis: a pinned pane must travel PAST the threshold plus slack to unpin, while an
    // unpinned one re-pins at the plain threshold — see SCROLL_UNPIN_SLACK_PX.
    const pinned = pinnedToBottomRef.current
      ? distance < SCROLL_PIN_THRESHOLD_PX + SCROLL_UNPIN_SLACK_PX
      : distance < SCROLL_PIN_THRESHOLD_PX;
    pinnedToBottomRef.current = pinned;
    setIsPinnedToBottom(previous => (previous === pinned ? previous : pinned));
  };
  useEffect(() => {
    const pane = scrollPaneRef.current;
    if (pane && pinnedToBottomRef.current) {
      pane.scrollTop = pane.scrollHeight;
    }
  }, [messages]);

  /**
   * "Jump to latest": the one convention the pinning logic above was missing (every streaming chat
   * UI offers it — see AI/ux-iter3/ux-research.md §B). Scrolls to the newest content and re-pins, so
   * the answer starts following again from here on.
   *
   * Smooth via `scrollTo`, NOT via a `scroll-behavior: smooth` rule on the pane: the effect above
   * writes `scrollTop` on every flushed streaming frame, and a smooth container would animate each
   * of those writes instead of tracking the stream — the pane would visibly lag behind the text.
   * That also means `prefers-reduced-motion` has to be honoured here in JS (the `behavior` option
   * ignores it), which is why this goes through `prefersReducedMotion()` above rather than relying
   * on the stylesheet's own reduced-motion block. Both browser APIs are probed rather than assumed:
   * `matchMedia` and `Element.prototype.scrollTo` are absent in jsdom, where this falls back to the
   * same direct `scrollTop` assignment the streaming effect uses.
   */
  const handleJumpToLatest = () => {
    repinToBottom();
    const pane = scrollPaneRef.current;
    if (!pane) {
      return;
    }
    if (!prefersReducedMotion() && typeof pane.scrollTo === 'function') {
      pane.scrollTo({ top: pane.scrollHeight, behavior: 'smooth' });
      return;
    }
    pane.scrollTop = pane.scrollHeight;
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
  // Declared HERE, above the handlers, rather than beside the JSX where they used to sit: the C1
  // composer-mode machine below reads `showWelcomeState`, and `handleSend` further down reads the
  // machine — with `no-use-before-define` (eslint.config.mjs) forbidding const hoisting, this is
  // the one ordering that satisfies both. The JSX consumes all four exactly as before.

  /**
   * C1 — the composer's own position state (see `ComposerMode` above for what each state means and
   * why the travel is a FLIP rather than a CSS transition).
   *
   * `docked` is the initial value on purpose: it is today's layout, so the very first paint of every
   * embedding context (and of a page that is still loading providers or restoring a conversation)
   * is exactly what it is now, and the centred state is only ever entered deliberately, by the
   * effect below. A conversation restored on mount therefore never passes through `centered` and
   * never animates — it has messages, so the effect leaves it `docked`.
   */
  const [composerMode, setComposerMode] = useState<ComposerMode>('docked');
  /** The travelling element: the composer's grid ROW, not the panel inside it. The row is what the
   * grid positions, and `.wzComposerRow` clips its own overflow (`overflow-y: auto`, the composer
   * ceiling), so a transform on anything inside it would be cut off mid-flight. */
  const composerRowRef = useRef<HTMLDivElement | null>(null);
  /** The greeting + example-cards cluster, measured for the same inversion: it has to stay visually
   * still while it fades, even though the layout underneath it has already changed. */
  const welcomeGroupRef = useRef<HTMLDivElement | null>(null);
  /** Viewport-relative tops captured in the LAST centred frame, i.e. the "First" half of FLIP. */
  const dockOriginRef = useRef<{
    composerTop: number;
    welcomeTop: number | null;
  } | null>(null);
  /**
   * "The centred welcome has already been dismissed for the conversation on screen." Without it,
   * the settle below could hand control back to the effect while `messages` is still empty (the
   * first `updateMessages` happens after `startTurn`'s awaited session probe, which is normally
   * instant but is a network call), and the composer would fly back up to the centre a beat after
   * it finished docking. Cleared wherever a genuinely fresh conversation appears
   * (`handleNewConversation`) or a stored one is loaded (`applyLoadedConversation`).
   */
  const welcomeDismissedRef = useRef(false);

  /**
   * The only entry into `centered`, and the only automatic exit that is NOT the send transition
   * (opening a saved conversation from the rail, whose messages make `showWelcomeState` false).
   * Never runs while `docking`: the machine owns that window, and re-deriving from
   * `showWelcomeState` inside it is exactly the flicker `welcomeDismissedRef` exists to prevent.
   */
  useEffect(() => {
    if (composerMode === 'docking') {
      return;
    }
    const shouldCenter =
      enableWelcomeComposer && showWelcomeState && !welcomeDismissedRef.current;
    if (shouldCenter && composerMode !== 'centered') {
      setComposerMode('centered');
    } else if (!shouldCenter && composerMode !== 'docked') {
      setComposerMode('docked');
    }
  }, [composerMode, enableWelcomeComposer, showWelcomeState]);

  /** Settles the machine: drops the inline FLIP styles and returns the pane to the plain docked
   * layout. Idempotent, because both settle paths (the `transitionend` fast path and the timer
   * fallback) can legitimately fire for the same travel. */
  const settleDock = () => {
    const row = composerRowRef.current;
    if (row) {
      row.style.transition = '';
      row.style.transform = '';
    }
    dockOriginRef.current = null;
    setComposerMode('docked');
  };

  /**
   * Starts the bridge. Called from `handleSend` while centred, BEFORE it awaits anything, so the
   * measurement below is taken from the frame the user actually pressed Send in.
   *
   * Reduced motion (and any environment where the composer row is not measurable) hard-cuts to
   * `docked`: no travel, no fade, no `docking` frame at all — the spec's own reduced-motion rule.
   */
  const beginDocking = () => {
    welcomeDismissedRef.current = true;
    const row = composerRowRef.current;
    if (!row || prefersReducedMotion()) {
      setComposerMode('docked');
      return;
    }
    dockOriginRef.current = {
      composerTop: row.getBoundingClientRect().top,
      welcomeTop: welcomeGroupRef.current?.getBoundingClientRect().top ?? null,
    };
    setComposerMode('docking');
  };

  /**
   * The "Invert" and "Play" halves of the FLIP, plus the settle fallback.
   *
   * `useLayoutEffect`, not `useEffect`: this runs after React has committed the docked layout but
   * BEFORE the browser paints it, which is the whole reason the composer is never seen at the
   * bottom for one frame. The inversion is applied with `transition: none` inline so the jump back
   * up is instant, then released on the next animation frame — at which point `.wzChatPane--docking`
   * (chat-page.scss) supplies the real `transition: transform $wzDockTravel` and the row travels
   * down to its committed position. The welcome ghost is inverted the same way but never released:
   * it only has to stay still while its own fade-out runs.
   *
   * An environment without `requestAnimationFrame` would otherwise be left holding the inverted
   * transform for good, so it settles immediately instead (jsdom does provide rAF; a legacy browser
   * simply gets the hard cut, same as reduced motion).
   */
  useLayoutEffect(() => {
    if (composerMode !== 'docking') {
      return undefined;
    }
    const origin = dockOriginRef.current;
    const row = composerRowRef.current;
    if (!origin || !row) {
      settleDock();
      return undefined;
    }
    const welcome = welcomeGroupRef.current;
    if (welcome && origin.welcomeTop !== null) {
      const welcomeDelta =
        origin.welcomeTop - welcome.getBoundingClientRect().top;
      welcome.style.transform = `translateY(${welcomeDelta}px)`;
    }
    const composerDelta = origin.composerTop - row.getBoundingClientRect().top;
    row.style.transition = 'none';
    row.style.transform = `translateY(${composerDelta}px)`;

    const timer = window.setTimeout(settleDock, DOCK_SETTLE_FALLBACK_MS);
    if (typeof window.requestAnimationFrame !== 'function') {
      settleDock();
      return () => window.clearTimeout(timer);
    }
    const frame = window.requestAnimationFrame(() => {
      row.style.transition = '';
      row.style.transform = '';
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the mode only: every other
    // value it reads is a ref, and re-running this on an unrelated re-render would restart the
    // travel from wherever it had got to.
  }, [composerMode]);

  /** The fast settle path. Scoped to the row's OWN transform (a nested EUI transition — a button's
   * hover, the textarea's height — bubbles to the same handler and must not end the travel early). */
  const handleComposerTransitionEnd = (
    event: React.TransitionEvent<HTMLDivElement>,
  ) => {
    if (
      composerMode === 'docking' &&
      event.target === event.currentTarget &&
      event.propertyName === 'transform'
    ) {
      settleDock();
    }
  };

  /**
   * The welcome group (greeting + example cards) outlives `showWelcomeState` by exactly one
   * transition: the moment the user's message is appended the welcome state is false, but the group
   * still has a fade-out to run, so `docking` keeps it mounted.
   *
   * While it is fading it is NO LONGER in flow (`.wzWelcomeCenter--leaving` is out-of-flow, and the
   * `--stretch` centring modifier comes off with it), which is what lets the transcript lay itself
   * out at its final height immediately — streaming starts on send, so the first user message can
   * land while the composer is still travelling, and it has to land in the position it will keep.
   */
  const welcomeIsInFlow = showWelcomeState && composerMode !== 'docking';
  const isWelcomeGroupMounted = showWelcomeState || composerMode === 'docking';

  /**
   * Conversation rail display mode (layout contract §5 / job item 6): expanded at >=1100px of
   * PANE width (not window width — `chatRootRef` is this component's own root, so an embedding
   * context that gives it less room, e.g. the docked header panel, collapses on its own), a 48px
   * collapsed strip below that, an `EuiFlyout` below 900px. `ConversationList` decides what to
   * render FOR each mode (this component only owns the column's width/chrome and the breakpoint
   * decision) via the optional `displayMode`/`onCollapse`/`onExpand` prop contract below — all
   * default-safe so neither side breaks while the other half of this redesign is mid-flight.
   *
   * Deliberately does NOT measure at all when `ResizeObserver` is unavailable (jsdom, and any
   * legacy browser) rather than falling back to a one-shot `offsetWidth` read: jsdom always
   * reports 0, which would collapse every existing test's sidebar into 'flyout' mode. Every
   * environment without `ResizeObserver` instead keeps the rail 'expanded', exactly how this
   * component behaved before the rail became width-responsive.
   *
   * A width of exactly 0 IS observed in a real browser too — a hidden (`display: none`) pane, e.g.
   * this component staying mounted behind the Settings tab (application.tsx) — and is ignored the
   * same way for the same reason: see the `!width` guard inside the effect below.
   *
   * `allowRailFlyout` (default true, see this component's own prop doc comment) caps the mode at
   * 'collapsed' instead of ever reaching 'flyout' — the docked header panel (assistant-chat-panel.tsx)
   * passes `false` because its own panel routinely sits inside the flyout band, where an `EuiFlyout`
   * would cover the whole dashboard from within a sidecar the user never asked to leave.
   */
  const chatRootRef = useRef<HTMLDivElement | null>(null);
  const [railDisplayMode, setRailDisplayMode] = useState<
    'expanded' | 'collapsed' | 'flyout'
  >('expanded');
  // A user-driven collapse/expand (via the rail's own affordance, once the other agent's
  // ConversationList implements one) wins over the next resize tick landing in the same width
  // bucket it already was in — reset the moment the pane crosses into/out of the flyout band,
  // where there is no inline rail to keep collapsed or expanded in the first place.
  const railManualOverrideRef = useRef<'expanded' | 'collapsed' | null>(null);
  const [isRailFlyoutOpen, setIsRailFlyoutOpen] = useState(false);

  useEffect(() => {
    const element = chatRootRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const update = () => {
      const width = element.offsetWidth;
      // A hidden pane (`display: none`) measures 0 — the app shell (application.tsx) keeps ChatPage
      // MOUNTED behind that while the Settings tab is showing, so every Chat<->Settings round-trip
      // used to run this callback against a width of 0. Treating that as "very narrow" flipped the
      // mode to 'flyout' AND (via the branch below) wiped `railManualOverrideRef`, so a rail the
      // user had collapsed by hand silently re-expanded on every trip back from Settings. A width of
      // 0 carries no real information about the pane's actual size, so it is ignored outright —
      // whatever mode/override is already in state stays exactly as it was until a genuine
      // measurement arrives.
      if (!width) {
        return;
      }
      if (width < RAIL_FLYOUT_AT) {
        if (!allowRailFlyout) {
          // The docked header panel (assistant-chat-panel.tsx) passes `allowRailFlyout={false}`:
          // its own panel routinely sits inside this band (600–900px), and an `EuiFlyout` there
          // would cover the whole dashboard from within a sidecar the user never asked to leave —
          // see this prop's own doc comment. Capping at 'collapsed' is what removes the escalation
          // instead of merely mitigating it.
          railManualOverrideRef.current = null;
          setRailDisplayMode('collapsed');
          return;
        }
        railManualOverrideRef.current = null;
        setRailDisplayMode('flyout');
        return;
      }
      setRailDisplayMode(
        railManualOverrideRef.current ??
          (width < RAIL_COLLAPSE_AT ? 'collapsed' : 'expanded'),
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [allowRailFlyout]);

  const handleRailCollapse = () => {
    railManualOverrideRef.current = 'collapsed';
    setRailDisplayMode('collapsed');
  };
  const handleRailExpand = () => {
    railManualOverrideRef.current = 'expanded';
    setRailDisplayMode('expanded');
  };

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

  // Persistent conversations: load the caller's own saved-conversation list once on mount, then
  // again on every CONVERSATIONS_CHANGED_EVENT so all mounted ChatPage instances (the app shell
  // and the header flyout can be open at once) keep their sidebars in sync.
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

  // Mutations dispatch this instead of calling refreshConversations() directly: the event reaches
  // every mounted ChatPage (including this one, synchronously), so the mutating instance refreshes
  // exactly once and the listener never re-dispatches — no loop, no double fetch.
  const notifyConversationsChanged = () => {
    window.dispatchEvent(new Event(CONVERSATIONS_CHANGED_EVENT));
  };

  useEffect(() => {
    refreshConversations();
    window.addEventListener(CONVERSATIONS_CHANGED_EVENT, refreshConversations);
    return () =>
      window.removeEventListener(
        CONVERSATIONS_CHANGED_EVENT,
        refreshConversations,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Loads a saved conversation into the live chat. Shared by the sidebar's resume handler and by the
   * mount-time restore below — the difference is only what each does around it (aborting an
   * in-flight turn, showing a spinner, reacting to a conversation that no longer exists).
   *
   * The pseudonym map and `turnHistoryRef` both reset: a resumed conversation has no client-held
   * pseudonym state to resume (server/conversation-store.ts's PRIVACY INTERACTION doc
   * comment: the map is wire-only and never persisted) and no stored tool_call/digest pairs to
   * replay as history either.
   */
  const applyLoadedConversation = (record: ConversationRecord) => {
    // A resumed conversation opens at its latest turn (bottom), like every chat client — through
    // `repinToBottom` so the jump button's own mirror is repinned with it.
    repinToBottom();
    // C1: the loaded conversation decides the composer's position on its own — with messages it
    // stays docked (no transition, it was never centred), and in the degenerate empty-transcript
    // case the welcome composer is legitimately offered again.
    welcomeDismissedRef.current = false;
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
    repinToBottom();
    // C1: a brand-new conversation gets the centred welcome composer back (the effect above picks
    // this up as soon as `messages` is empty again) — the transition is once per conversation, not
    // once per session.
    welcomeDismissedRef.current = false;
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
      notifyConversationsChanged();
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
        notifyConversationsChanged();
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
   * "Retry now" on the saveFailed callout. Re-invokes `persistConversationTurn` — the SAME
   * persistence path every auto-save already goes through — instead of a second save
   * implementation, so success clears `saveFailed` exactly like the auto path does (that function's
   * own `setSaveFailed(false)` on a successful `adoptAsActive` save) and a failure re-sets it exactly
   * the same way too.
   *
   * `target` is built from this tab's live `activeConversationIdRef`/`conversationVersionRef` —
   * the same pair `startTurn` reads when it constructs a fresh turn's target — so a conversation
   * that was never created yet (still `null`) is POSTed once, and one that already has an id is
   * PUT to that SAME row: this can never create a second conversation for what the user sees as one
   * conversation, whether the failing save was the first one or a later one.
   *
   * Blocked while `isGenerating`: the in-flight turn (`startTurn`) already holds its OWN
   * `TurnConversationTarget` in closure (shared between its pre-send save and its post-answer
   * save — see that target's own doc comment) — a `target` built here from the live refs while
   * that turn is still streaming is a DIFFERENT object. If the turn's pre-send save has already
   * failed (raising this very callout) but not yet created the row, firing this handler would
   * race it: this save creates+adopts the conversation from the live refs, while the turn's own
   * target still holds `conversationId: null` and later POSTs a second row instead of updating
   * the one this save just created. The turn's post-answer auto-save runs moments after the
   * stream ends anyway, so a mid-stream retry is redundant — the button is disabled instead of
   * queued so the same click is never re-armed into a second attempt when generation finishes.
   */
  const handleRetrySave = () => {
    if (isRetryingSave || isGenerating) {
      return;
    }
    setIsRetryingSave(true);
    const target: TurnConversationTarget = {
      conversationId: activeConversationIdRef.current,
      version: conversationVersionRef.current,
    };
    void persistConversationTurn({
      adoptAsActive: true,
      target,
      messages: messagesRef.current,
      turnRecords: turnHistoryRef.current,
    }).finally(() => setIsRetryingSave(false));
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
    // later, real one. Flushed if the stream ends before anything replaces it — "keep a
    // single empty table if it's the only one" (honest-empty stays correct). A plain local
    // variable, not a ref/state: scoped to this one stream's sequential event loop only.
    //
    // RENDERING NOTE (CEO item 6, ux-iter3 C4): flushing an honest-empty spec still COMMITS it to
    // `message.table` — that is this turn's record of "a query ran and matched nothing", and it is
    // what gets persisted with the conversation — but it no longer draws anything: message-bubble.tsx
    // suppresses the card for a 0-row spec and shows one quiet subdued line in its place when the
    // turn produced no prose of its own. The gate is deliberately in the renderer and not here, so
    // conversations SAVED before that change (whose stored turns already carry 0-row specs) stop
    // drawing the empty card on resume too. Nothing about this buffer's behavior or its invariant
    // below changed; only what a committed empty spec looks like on screen did.
    //
    // INVARIANT: within one turn, an empty table may NEVER replace — or outlive alongside — a
    // non-empty one. The suppression above is one-directional: real rows always win over an empty
    // spec, never the other way. This buffer and `pendingTable` are flushed together from three
    // different call sites below (`finally`, the `error` branch, the `auth_expired` branch), and
    // the sites do not all use the same flush order (`finally`/`auth_expired` flush the non-empty
    // buffer first, `error` flushes the empty one first). On the unfixed code only `finally` was
    // reachably broken: `error`'s empty-first order happened to be benign (the later non-empty
    // commit won), and `auth_expired` can never hold content at all — chat-service.ts emits it
    // only on the initial POST's 401, before any SSE frame (so no `table` event) has been read.
    // But "happens to be benign" and "currently unreachable" are exactly the properties a future
    // reorder or a new terminal path silently breaks. The invariant is therefore enforced
    // independently at BOTH ends of this buffer's lifecycle instead of relying on flush order:
    // `hasNonEmptyTableForTurn` (below) gates
    // both the `table` event handler's empty branch (refuses to queue an empty spec once a
    // non-empty one exists for this turn) and `flushPendingEmptyTable` itself (yields to a
    // pending-or-committed non-empty table instead of committing). With both ends covered, no
    // future call-site addition or reordering can reintroduce the clobber.
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
    /**
     * Whether this turn already has, or is about to have, a table with rows in it — the single
     * predicate both ends of the empty-table invariant above check, so they can never disagree.
     * Checks `pendingTable` (a non-empty table not yet committed, e.g. still waiting on the first
     * delta) as well as `committedTable` (already committed, by whichever flush ran first this
     * turn). `rows.length > 0`, not mere truthiness, matters on BOTH arms: a previously-committed
     * HONEST-empty table (this turn's only table so far) must still be superseded by a later
     * non-empty one — the existing empty→rows retry path — so this only starts refusing once
     * something with actual rows exists. (Today only the non-empty `table` branch ever assigns
     * `pendingTable`, so its arm could be plain truthiness — but the explicit row check keeps the
     * predicate correct even if a future refactor parks an empty spec there, instead of silently
     * turning honest-empty turns into no-table turns.)
     */
    const hasNonEmptyTableForTurn = () =>
      (pendingTable !== undefined && pendingTable.rows.length > 0) ||
      (committedTable !== undefined && committedTable.rows.length > 0);
    const flushPendingEmptyTable = () => {
      if (!pendingEmptyTable) {
        return;
      }
      // Yield to a non-empty table regardless of which flush call site got here first this turn —
      // see the invariant comment on `pendingEmptyTable`. Drop the stale empty spec rather than
      // committing it. NOTE: with the arrival-side guard below in place this branch is currently
      // unreachable by construction (an empty spec is never queued once a non-empty table exists,
      // and every later writer that could make the predicate true also clears this buffer). It is
      // kept as defence-in-depth for a future writer of `pendingEmptyTable`, not because any
      // event sequence reaches it today — do not count it as a tested code path.
      if (hasNonEmptyTableForTurn()) {
        pendingEmptyTable = undefined;
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
            // Arrival-side half of the invariant on `pendingEmptyTable`: refuse to queue an empty
            // spec at all once a non-empty table already exists for this turn, rather than queuing
            // it and relying on flush order to sort it out later. If a non-empty table has not
            // arrived (or committed) yet, this is either the honest-empty case or a retry's first
            // (failed) attempt, and is held exactly as before.
            if (!hasNonEmptyTableForTurn()) {
              pendingEmptyTable = event.spec;
            }
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
        } else if (event.type === 'suggested_query') {
          // Graceful-failure handoff (server/tools/suggest-discover-query.ts): a callout rendered
          // alongside this message's prose (message-bubble.tsx), not another `table` — the model
          // is telling the user what it could NOT check, so there is no result set to show, only a
          // query the user can run themselves. Set immediately (unlike `table`'s held/flushed
          // `pendingTable`) since it has no ordering dependency on delta text arriving first.
          if (isTurnStillActive()) {
            const suggestedQuery = {
              index: event.index,
              dsl: event.dsl,
              reason: event.reason,
            };
            updateMessages(current =>
              current.map(message =>
                message.id === assistantMessageId
                  ? { ...message, suggestedQuery }
                  : message,
              ),
            );
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
    // Pre-turn session guard: after >60s idle, re-probe (and heal if the wz-token
    // expired) so this turn's Manager-path tool calls see a fresh token. The 60s memo makes it free
    // during rapid back-and-forth; `detectManagerAuthError` below stays the mid-turn backstop.
    await ensureManagerSession(core.http, { maxAgeMs: 60_000 });

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
    repinToBottom();
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
    // C1: the first send of a centred conversation is what docks the composer. Started here, before
    // the first `await`, for two reasons: the FLIP measurement has to be taken from the frame the
    // user pressed Send in, and the transcript has to be in its final (docked) layout before the
    // user's own message lands in it — `startTurn` appends that message after an awaited session
    // probe, so anything scheduled later could race it. Deliberately AFTER the no-provider guard
    // above: a send that never happens must not move the composer.
    if (composerMode === 'centered') {
      beginDocking();
    }
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

  /** `error` is the send-path failure; `providersError` the app shell's provider-load failure. One
   * callout reports whichever is current, so dismissal is tracked against this one value. */
  // Composer control-row spec (iteration-4): the Send button's own disabled/enabled state, split
  // out once so both the `disabled` prop and the `display` (filled only when it would actually
  // do something) read the same condition instead of re-deriving it in two places.
  const canSend = hasProviders && Boolean(inputText.trim());
  const activeError = error ?? providersError;
  const showErrorCallout =
    Boolean(activeError) && activeError !== dismissedError;
  /**
   * Gates the sticky status-callout band below, so an empty band never paints its opaque ground
   * over the first transcript row. Mirrors the conditions of the individual callouts inside it —
   * each still decides its own visibility; this only decides whether the band exists at all.
   */
  const hasStatusCallout =
    sessionExpired ||
    showErrorCallout ||
    managerAuthHint ||
    saveFailed ||
    mergeNotice === 'merged' ||
    mergeNotice === 'conflict';

  // Layout contract §1 (AI/design/redesign-v2-spec.md): the composer (`.wzComposerRow` below) is
  // the grid's own `auto` row, a real flow sibling of the transcript's `1fr` row — never an
  // absolutely/sticky-positioned overlay. That is what makes the old overlap (a fixed-height fade
  // gradient painted outside the sticky panel's own box, caught covering the last few pixels of the
  // transcript's final element — a table's pagination bar — even scrolled all the way down)
  // structurally impossible instead of something tuned per breakpoint: there is no gradient to
  // desync from a compensating `padding-bottom`, because there is nothing left for either of them
  // to compensate for. A taller composer (multiline input, up to `$wzComposerMaxHeight`) simply
  // takes more of the grid's `auto` row, which the `1fr` row yields automatically.

  const privacyBadgeLabel = privacyEnabled
    ? i18n.translate('wazuhAiAssistant.chat.privacy.on', {
        defaultMessage: 'On',
      })
    : i18n.translate('wazuhAiAssistant.chat.privacy.off', {
        defaultMessage: 'Off',
      });
  const privacyBadgeIcon = privacyEnabled ? 'lock' : 'lockOpen';
  // Single pill replacing the old padlock EuiButtonEmpty + floating EuiIconTip pair (iteration-4
  // composer control-row spec): the icon + "Privacy · On/Off" label carries the state, and —
  // only when the admin has left it overridable — the click affordance to flip it. `onClick`/
  // `onClickAriaLabel` are spread in together rather than each defaulting to `undefined`, since
  // OuiBadge warns if `onClickAriaLabel` is present without `onClick` (and vice versa reads as a
  // badge that looks clickable but isn't). The explanation of what the state does to the user's
  // data used to live in a hover tooltip wrapping this whole pill, which meant hovering to click
  // it also forced a wall of text — it now lives on a separate, discrete ⓘ (`EuiIconTip`) placed
  // right after the pill, so it is available on demand without blocking the click gesture.
  const privacyChip = (
    <EuiBadge
      className={`wzPrivacyChip wzPrivacyChip--${privacyEnabled ? 'on' : 'off'}`}
      color='hollow'
      iconType={privacyBadgeIcon}
      data-test-subj='wzPrivacyChip'
      {...(assistantSettings?.userCanOverride
        ? {
            onClick: handleTogglePrivacy,
            onClickAriaLabel: privacyEnabled
              ? i18n.translate('wazuhAiAssistant.chat.privacy.toggleToOff', {
                  defaultMessage: 'Turn privacy mode off',
                })
              : i18n.translate('wazuhAiAssistant.chat.privacy.toggleToOn', {
                  defaultMessage: 'Turn privacy mode on',
                }),
          }
        : {})}
    >
      {i18n.translate('wazuhAiAssistant.chat.privacy.chipLabel', {
        defaultMessage: 'Privacy · {state}',
        values: { state: privacyBadgeLabel },
      })}
    </EuiBadge>
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

  // Conversation header title: the active conversation's own saved title when one is open
  // (looked up from the sidebar's own `conversations` list, never re-derived), or the
  // "New conversation" fallback for a brand-new, never-yet-saved one.
  const activeConversationTitle = activeConversationId
    ? conversations.find(
        conversation => conversation.id === activeConversationId,
      )?.title
    : undefined;

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
      {/* wzAiChat: the `--wz-*` token block chat-page.scss defines from EUI's own `$eui*` SASS
        variables — every color/border reference in this subtree (rail rows, welcome cards, the
        composer's focus ring) reads one of those custom properties instead of a hardcoded hex
        or a JS-computed `theme:darkMode` branch. Custom properties inherit through the whole DOM
        subtree regardless of component boundaries, so nothing downstream needs its own dark-mode
        prop threaded down to it. Also the rail-display-mode measurement root — see the
        `railDisplayMode` effect above. */}
      <div
        ref={chatRootRef}
        className='wzAiChat'
        style={{
          display: 'flex',
          height: '100%',
          minHeight: 0,
        }}
      >
        {/* Left pane: saved-conversations rail. EuiPanel color="subdued" gives the standard OSD
          "sunken" pane background without inventing a new hardcoded color. Width and the
          expanded/collapsed choice are THIS component's (layout contract §5/§6); what a
          'collapsed' 48px strip actually shows is ConversationList's own concern. */}
        {showConversationSidebar && railDisplayMode !== 'flyout' && (
          <EuiPanel
            color='subdued'
            hasShadow={false}
            hasBorder={false}
            borderRadius='none'
            paddingSize={railDisplayMode === 'collapsed' ? 's' : 'm'}
            // EuiPanel's `grow` prop DEFAULTS TO TRUE (flex-grow:1), which in this flex-row parent
            // overrode the fixed width below and let the sidebar swallow half the page. A
            // fixed-width pane must explicitly opt out.
            grow={false}
            role='region'
            aria-label={i18n.translate(
              'wazuhAiAssistant.chat.conversations.sidebarRegionLabel',
              {
                defaultMessage: 'Saved conversations',
              },
            )}
            // `wzConvoRail` (conversation-list.scss) makes this panel a full-height flex column,
            // which is what lets the rail's "Collapse" control pin itself to the bottom instead of
            // simply following the last conversation.
            className='wzConvoRail'
            style={{
              width:
                railDisplayMode === 'collapsed'
                  ? RAIL_COLLAPSED_WIDTH
                  : CONVERSATION_SIDEBAR_WIDTH,
              maxWidth:
                railDisplayMode === 'collapsed'
                  ? RAIL_COLLAPSED_WIDTH
                  : CONVERSATION_SIDEBAR_WIDTH,
              flexShrink: 0,
              minWidth: 0,
              // `.wzConvoRail`'s own list child scrolls (conversation-list.scss); the panel
              // scrolling too is what produced a second, horizontal scrollbar and pushed the
              // pinned Collapse control below the fold.
              overflow: 'hidden',
              // `--wz-hairline` (chat-page.scss, sourced from `$euiBorderColor`) replaces the old
              // hardcoded `#D3DAE6` — that hex was EUI's light-theme `lightShade` token with no
              // dark-mode counterpart, so it rendered as the brightest edge on the page in dark mode.
              borderRight: '1px solid var(--wz-hairline)',
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
                void confirmIfGenerating(
                  () => void handleSelectConversation(id),
                );
              }}
              onNewConversation={() =>
                void confirmIfGenerating(handleNewConversation)
              }
              onDelete={handleDeleteConversation}
              // Rail prop contract agreed with the ConversationList owner (job item 6): all three
              // are optional with defaults, so this call is safe to ship whether or not
              // conversation-list.tsx has picked them up yet.
              displayMode={railDisplayMode}
              onCollapse={handleRailCollapse}
              onExpand={handleRailExpand}
            />
          </EuiPanel>
        )}

        {/* Below the flyout threshold there is no room for an inline rail at all — a small
          trigger opens ConversationList inside an EuiFlyout instead (variation 4a's own flyout
          idiom, reused here for the rail rather than invented fresh). This button is new UI the
          spec's layout contract implies but does not itself word — see this component's final
          report for the exact i18n key. */}
        {showConversationSidebar && railDisplayMode === 'flyout' && (
          <div
            style={{
              flexShrink: 0,
              borderRight: '1px solid var(--wz-hairline)',
              padding: '8px 4px',
            }}
          >
            <EuiButtonIcon
              iconType='menu'
              color='text'
              onClick={() => setIsRailFlyoutOpen(true)}
              aria-label={i18n.translate(
                'wazuhAiAssistant.chat.conversations.openRailButton',
                { defaultMessage: 'Show conversations' },
              )}
            />
          </div>
        )}
        {showConversationSidebar &&
          railDisplayMode === 'flyout' &&
          isRailFlyoutOpen && (
            <EuiFlyout
              size='s'
              ownFocus
              onClose={() => setIsRailFlyoutOpen(false)}
              aria-label={i18n.translate(
                'wazuhAiAssistant.chat.conversations.sidebarRegionLabel',
                { defaultMessage: 'Saved conversations' },
              )}
            >
              {/* EuiFlyout portals into document.body, past every ancestor that defines the
                `--wz-*` tokens — including `.wzAiChat` — so without a block of its own the rail's
                selected/hover row pills resolve to nothing inside it. Carried by a plain wrapper
                rather than by EuiFlyout's own `className`: that prop does not reach an element
                that ends up ancestral to this content in this EUI build, which a regression test
                caught. `.wzConvoRailFlyout` sets custom properties only, so an extra div here
                changes no layout. */}
              <div className='wzConvoRailFlyout'>
                <EuiFlyoutBody>
                  <ConversationList
                    conversations={conversations}
                    isLoading={isLoadingConversations}
                    activeConversationId={activeConversationId}
                    onSelect={id => {
                      if (id === activeConversationIdRef.current) {
                        setIsRailFlyoutOpen(false);
                        return;
                      }
                      void confirmIfGenerating(() => {
                        void handleSelectConversation(id);
                        setIsRailFlyoutOpen(false);
                      });
                    }}
                    onNewConversation={() =>
                      void confirmIfGenerating(() => {
                        handleNewConversation();
                        setIsRailFlyoutOpen(false);
                      })
                    }
                    onDelete={handleDeleteConversation}
                    displayMode='flyout'
                    onCollapse={handleRailCollapse}
                    onExpand={handleRailExpand}
                  />
                </EuiFlyoutBody>
              </div>
            </EuiFlyout>
          )}

        {/* Right pane: the chat column. Layout contract §1 — a two-row CSS grid
          (`grid-template-rows: 1fr auto`, chat-page.scss `.wzChatPane`), NOT the flex column plus
          `position: sticky` composer this replaces. Row 1 (`.wzChatTranscript` below) is the ONLY
          scroll container; row 2 (`.wzComposerRow` below) stays in normal flow. That grid boundary
          — not a tuned padding/gradient pair — is what makes the composer/welcome overlap this
          redesign fixes structurally impossible instead of merely rare.

          C1 adds exactly two temporary modifiers to that pane (`PANE_CLASS_BY_COMPOSER_MODE`
          above): `--welcome` while the empty state is one centred group, and `--docking` for the
          ~400ms bridge. The `docked` entry is the bare `wzChatPane` this always was, so the end
          state of every conversation — and every state of the embedded sidecar — is unchanged. */}
        <div
          className={PANE_CLASS_BY_COMPOSER_MODE[composerMode]}
          style={{ flex: 1, minWidth: 0 }}
        >
          {/* The conversation's ONE scroll container — scrollbar belongs at the pane's far edge
            like any chat app, and should only exist once content overflows (no permanently
            reserved gutter). The auto-scroll pinning refs above target it; overflowAnchor keeps
            Chrome's scroll anchoring from fighting the pinning while answers stream. */}
          <div
            ref={scrollPaneRef}
            onScroll={handleScrollPane}
            role='region'
            aria-label={i18n.translate(
              'wazuhAiAssistant.chat.chatPaneRegionLabel',
              {
                defaultMessage: 'Chat',
              },
            )}
            className='wzChatTranscript'
          >
            {/* `.wzTranscriptContent` (chat-page.scss): the full-width wrapper that owns the ONE
              shared `24px 24px 24px` gutter — `.wzContentMeasure` below (header/callouts/welcome)
              and `MessageList` (rendered as ITS sibling further down, not its descendant) both sit
              inside it, which is what lets a table-bearing turn's own row measure past
              `.wzContentMeasure`'s 1060px cap instead of being clipped to it (layout contract §5). */}
            <div
              className='wzTranscriptContent'
              // Restores lead breath at the top (16 -> 24px) and adds the tail breath the
              // transcript never had at all (0 -> 24px) so the last turn is not flush against the
              // composer's own hairline (iteration-4 audit, P1 item 7). See `.wzStatusCallouts`
              // (chat-page.scss) for why the top half of this still scrolls out from under the
              // sticky band rather than staying visible above it.
              style={{ padding: '24px 24px 24px' }}
            >
              {/* `.wzContentMeasure` (chat-page.scss): the ONE centred column transcript prose and
              the composer share (layout contract §5) — reads `$wzContentMaxWidth` off the shared
              `_redesign.scss` token instead of restating it, which is what this file's old
              `CONVERSATION_MAX_WIDTH = 860` constant used to do in parallel. `--stretch` only while
              this holds the welcome state (see chat-page.scss's own comment on that modifier) — the
              ordinary message-list case stays a plain flow box so it never claims the whole
              transcript height for itself and pushes `MessageList`'s sibling row out of view. */}
              {/* `.wzStatusCallouts` (chat-page.scss): the sticky status band. It is a DIRECT child
                of `.wzTranscriptContent` rather than of `.wzContentMeasure` below, and that
                placement is the whole point — a `position: sticky` element can only travel inside
                its own parent's box, and the non-welcome `.wzContentMeasure` is a plain flow box
                only as tall as the callouts themselves, so sticking inside it had nowhere to go and
                the band scrolled away with the first screenful. `.wzTranscriptContent` is the flex
                column that spans the transcript's whole scroll height (`min-height: 100%`), so a
                sticky child of THIS box stays pinned for the entire conversation. Kept as the first
                child so the band sits above the transcript rather than below the welcome state.
                Rendered only when something is actually in it (`hasStatusCallout`) — see that
                flag's comment. */}
              {hasStatusCallout && (
                <div className='wzStatusCallouts'>
                  {/* Same shared 1060px measure as the transcript prose below, so a pinned callout
                    lines up with the messages it is reporting on instead of spanning wider. */}
                  <div className='wzContentMeasure'>
                    {/* Callouts render in priority order (never suppressed — resilience-first: every
                      state is shown, just ordered): session expiry first (it blocks everything
                      else), then generic errors, then a failed auto-save, then the
                      optimistic-concurrency merge notices. Session-expiry recovery UX: a genuine
                      401, distinct from managerAuthHint's best-effort heuristic below. Persistent
                      (no dismiss control, and nothing in this file ever calls
                      setSessionExpired(false) except starting a fresh send) until the user reloads,
                      per this fix's brief. */}
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

                    {/* The one dismissible callout in the band. A failed turn is already visible in
                      the transcript and the user can simply ask again, so once they have read why it
                      failed there is nothing left for this to report — unlike the session-expiry and
                      save-failure notices around it, which describe a condition that is still true
                      after being read and so stay put (see `StatusCallout`'s `onDismiss` doc).
                      Dismissal is per-message, so the next failure surfaces again on its own. */}
                    {showErrorCallout && (
                      <StatusCallout
                        title={i18n.translate(
                          'wazuhAiAssistant.chat.errorTitle',
                          {
                            defaultMessage: 'Something went wrong',
                          },
                        )}
                        color='danger'
                        iconType='alert'
                        body={activeError}
                        onDismiss={() => setDismissedError(activeError)}
                      />
                    )}

                    {managerAuthHint && (
                      <StatusCallout
                        title={i18n.translate(
                          'wazuhAiAssistant.chat.managerAuthHint.title',
                          {
                            defaultMessage:
                              'Your Wazuh session may have expired',
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

                    {/* A failed auto-save is surfaced instead of swallowed: the conversation on
                    screen is ahead of what is stored, which the user cannot infer from anything
                    else. Not dismissible — this reports real data-loss risk — but no longer purely
                    passive: the next turn's save still retries on its own, and "Retry now"
                    (handleRetrySave) lets the user clear it immediately once whatever blocked the
                    save (e.g. a read-only index) is fixed, instead of waiting on the next answer.
                    Either path clears this the same way, via persistConversationTurn's own
                    setSaveFailed(false) on success. */}
                    {saveFailed && (
                      <StatusCallout
                        title={i18n.translate(
                          'wazuhAiAssistant.chat.conversations.saveFailed.title',
                          {
                            defaultMessage:
                              'This conversation is not being saved',
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
                        action={
                          <EuiButton
                            size='s'
                            color='warning'
                            onClick={handleRetrySave}
                            // Also disabled while a turn is generating: retrying with a target
                            // built from the live refs while the in-flight turn's OWN target is
                            // still unresolved (e.g. its pre-send save hasn't created the row yet)
                            // would race it into creating a second conversation row — see
                            // handleRetrySave's doc comment. The turn's own post-answer save runs
                            // moments after streaming ends.
                            isLoading={isRetryingSave}
                            isDisabled={isRetryingSave || isGenerating}
                          >
                            {i18n.translate(
                              'wazuhAiAssistant.chat.conversations.saveFailed.retryButton',
                              { defaultMessage: 'Retry now' },
                            )}
                          </EuiButton>
                        }
                      />
                    )}

                    {/* Optimistic-concurrency notice: shown after persistConversationAfterTurn's
                      auto-save hit a 409 on the last completed turn — see
                      saveConversationWithMerge's own doc comment for exactly when each variant
                      fires. Non-blocking: the chat itself is fully usable either way, this is
                      purely informational. */}
                    {mergeNotice === 'merged' && (
                      <StatusCallout
                        title={i18n.translate(
                          'wazuhAiAssistant.chat.conversations.mergedNotice.title',
                          {
                            defaultMessage: 'Conversation merged',
                          },
                        )}
                        // A successful merge is a good outcome, not a warning — the conflict
                        // variant right below keeps 'warning'/'alert', so the two are no longer
                        // visually identical for opposite results.
                        color='success'
                        iconType='check'
                        body={i18n.translate(
                          'wazuhAiAssistant.chat.conversations.mergedNotice.body',
                          {
                            defaultMessage:
                              'This conversation was also updated in another tab. The versions were merged.',
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
                  </div>
                </div>
              )}

              <div
                // `wzWelcomeMeasure` (chat-page.scss), not the bare `.wzContentMeasure` this also
                // carries: the 840px welcome-cluster cap is scoped to THIS class specifically,
                // because the sticky status-callout band above (`.wzStatusCallouts`) wraps its own
                // content in a plain `.wzContentMeasure` too — an unscoped `.wzChatPane--welcome
                // .wzContentMeasure` rule narrowed that band as an unrelated side effect.
                className={
                  welcomeIsInFlow
                    ? 'wzContentMeasure wzContentMeasure--stretch wzWelcomeMeasure'
                    : 'wzContentMeasure wzWelcomeMeasure'
                }
              >
                {/* The view's `<h1>`, for assistive tech only. The chat column had no heading at all,
                    which left screen-reader users without a name for the thing they are reading and
                    the page without a document outline. A VISIBLE header was tried and dropped: a
                    conversation's title is generated from its first message, so a visible strip
                    restated the user's own question directly above that same question in the
                    transcript, and the sidebar already marks which conversation is open. Screen-
                    reader-only keeps the semantics without the duplication — and matches the Home
                    Overview, which likewise shows no page-scale title. */}
                {!showLoadingState && !showNoProviderState && (
                  <EuiScreenReaderOnly>
                    <h1>
                      {activeConversationTitle ??
                        i18n.translate(
                          'wazuhAiAssistant.chat.conversations.newConversationHeading',
                          {
                            defaultMessage: 'New conversation',
                          },
                        )}
                    </h1>
                  </EuiScreenReaderOnly>
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
                        {i18n.translate(
                          'wazuhAiAssistant.chat.noProvider.title',
                          {
                            defaultMessage: 'No AI provider configured',
                          },
                        )}
                      </h2>
                    }
                    body={
                      <p>
                        {i18n.translate(
                          'wazuhAiAssistant.chat.noProvider.body',
                          {
                            defaultMessage:
                              'The AI Assistant needs at least one connected provider (OpenAI-compatible or Anthropic) before it can answer questions. Add one to get started.',
                          },
                        )}
                      </p>
                    }
                    actions={
                      <EuiButton
                        color='primary'
                        fill
                        onClick={onNavigateToSettings}
                      >
                        {i18n.translate(
                          'wazuhAiAssistant.chat.noProvider.action',
                          {
                            defaultMessage: 'Add a provider',
                          },
                        )}
                      </EuiButton>
                    }
                  />
                )}

                {/* Welcome centres only when there is room (contract §3): `.wzWelcomeCenter`
                    (chat-page.scss) is a `flex: 1 1 auto` column with `justify-content: center`,
                    growing into whatever the transcript row leaves it. NOT the
                    `display:grid; place-content:center` this comment used to describe — on a grid
                    container `place-content` also sets `justify-content`, which packed the column
                    track at its content width and collapsed the example cards to one per row. A
                    tall viewport centres the cluster; a short one has nowhere to grow into, so this
                    stops at the content's own height and the transcript's own `overflow-y: auto`
                    takes over — nothing here can ever reach the composer, which is a grid sibling
                    of the transcript, never a descendant of it.

                    C1 layers on top WITHOUT moving any of this: in the centred state the pane
                    itself becomes the centring container (`.wzChatPane--welcome`), so this cluster
                    and the composer read as one group while each stays exactly where it already
                    lived in the DOM. That is deliberate — the composer must remain ONE React
                    instance across the transition (re-parenting it into this subtree would remount
                    ChatInput, dropping focus and the textarea's autogrow height, and an element
                    cannot animate across a remount). The order inside the group is therefore
                    greeting → cards → composer rather than the recording's greeting → composer:
                    Gemini shows no cards at all, and putting ours BELOW the composer would need a
                    second render site for them plus a pane row underneath the travelling composer
                    for the transition to pass through. Group composition and motion match the spec;
                    the internal order is the one the existing DOM already gives. */}
                {isWelcomeGroupMounted && (
                  <div
                    ref={welcomeGroupRef}
                    className={
                      welcomeIsInFlow
                        ? 'wzWelcomeCenter'
                        : 'wzWelcomeCenter wzWelcomeCenter--leaving'
                    }
                  >
                    <EuiEmptyPrompt
                      // No `icon`: this chat already lives inside the Wazuh app chrome, so a Wazuh
                      // mark on the welcome screen only repeated branding the user can already see.
                      title={
                        // EUI's own type scale (size='m') instead of an inline fontSize/weight/
                        // letter-spacing override — the whole point of this pass is to stop
                        // fighting EuiEmptyPrompt's built-in typography with inline styles.
                        //
                        // Page-title scale, decided: this greeting stays at EuiTitle `m` (24px)
                        // while the settings page's H1 is 28. The live audit (§6) flagged the two
                        // as an inconsistency and offered either "pick 28 everywhere" or "make the
                        // greeting a deliberate hero" — this is the second. The greeting is not a
                        // page title doing a navigational job; it is the one large element on an
                        // otherwise empty canvas (rulebook B7: only 1–2 large elements per view),
                        // and it shares its screen with nothing else that competes for that rank,
                        // so 24 is the size that keeps the cluster feeling like a group rather than
                        // like a page header with content under it. Settings, which really does
                        // have a header over three sections, keeps 28.
                        <EuiTitle size='m'>
                          <h2>
                            {i18n.translate(
                              'wazuhAiAssistant.chat.welcome.title',
                              {
                                defaultMessage:
                                  'Ask the AI Assistant something',
                              },
                            )}
                          </h2>
                        </EuiTitle>
                      }
                      body={
                        // `color='subdued'`: the title alone should carry the visual weight — a
                        // same-weight subtitle right under it was competing with it instead of
                        // reading as a second, lighter tier of the same heading (the "clear heading
                        // hierarchy" half of the welcome-screen polish pass). Text itself is
                        // unchanged, so the i18n id stays stable.
                        <EuiText size='m' color='subdued'>
                          <p>
                            {i18n.translate(
                              'wazuhAiAssistant.chat.welcome.subtitle',
                              {
                                defaultMessage:
                                  'Ask questions about your security data in plain language.',
                              },
                            )}
                          </p>
                        </EuiText>
                      }
                    />
                    {/* 16, not 24: greeting → cards → composer are now one evenly-spaced group
                        (audit §1.5 / rulebook C16 — the trio was 24/9, i.e. neither even nor on the
                        ladder). The composer's own half of that step lives in
                        `.wzChatPane--welcome .wzComposerMeasure` (chat-page.scss). */}
                    <EuiSpacer size='m' />
                    {/* Three horizontal cards — icon-left, short title, the full question as the
                        description. Clicking a card only fills the input (unchanged `setInputText`
                        call), never auto-sends.

                        NO grouping panel around them, and no "Try one of these" pill header. Both
                        were variation 1a's original shape and both were measured as failures
                        (audit §1.2/§1.3): the outer `EuiPanel` had the identical fill, hairline and
                        radius as the `EuiCard`s inside it, so the group read as a card-in-a-card
                        with no information in the outer one; and the pill was a THIRD piece of
                        instructional copy under a title and subtitle that already say what to do,
                        centred over left-aligned cards. The cards' own borders group them perfectly
                        well — this is a plain layout div now, carrying only the grid. */}
                    {/* `.wzExampleCardsGrid` (chat-page.scss): `repeat(auto-fit, minmax(240px,
                        1fr))` — 3-up, 2-up, 1-up with no fixed pixel card widths, so this can
                        never be the thing that introduces horizontal scroll (contract §3). */}
                    <div className='wzExampleCardsGrid'>
                      {EXAMPLE_CARDS.map(card => (
                        <EuiCard
                          key={card.id}
                          className='wzWelcomeCard'
                          layout='horizontal'
                          display='plain'
                          hasBorder
                          // `xs` (16px), down from EuiCard's default `s` (18px): the card titles
                          // used to be BIGGER and bolder than the greeting they sit under
                          // (18/500 vs 24/400), which inverted the screen's own hierarchy — the
                          // eye landed on a card title first (audit §1.4, rulebook B8).
                          titleSize='xs'
                          icon={
                            <EuiIcon
                              type={card.icon}
                              size='l'
                              color='primary'
                            />
                          }
                          title={card.title}
                          description={card.question}
                          onClick={() => setInputText(card.question)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* `MessageList` is `.wzContentMeasure`'s SIBLING inside `.wzTranscriptContent`, not its
              descendant — see this file's `.wzTranscriptContent` doc comment above. Nesting it
              inside `.wzContentMeasure` (the pre-fix shape) capped every row's own breakout width
              against that element's 1060px measure, which is why a table-bearing turn could never
              actually reach `min(100%, $wzTableMaxWidth)` regardless of window width. */}
              {!showLoadingState &&
                !showNoProviderState &&
                !showWelcomeState && (
                  <MessageList
                    transcriptHeightPx={transcriptHeightPx}
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
          </div>

          {/* "Jump to latest" (ux-research.md §B: the affordance every streaming chat UI pairs with
            stick-to-bottom scrolling). Shown whenever the user is unpinned — not only while a turn
            is streaming, which is what Claude/ChatGPT do: after an answer finishes, "take me back
            to the end" is exactly as useful as it was mid-stream, and gating on `isGenerating`
            would make the control blink out from under the pointer the moment the stream ended.
            The pinning logic itself is untouched (`pinnedToBottomRef` above); this only renders its
            state and calls the same re-pin the send path already used.

            A SIBLING of the transcript in `.wzChatPane`, explicitly placed back into the grid's
            first row by `.wzJumpToLatest` (chat-page.scss) — NOT a child of the scroll container,
            which would scroll away with the content, and NOT viewport-fixed, which would float over
            whatever else the page is showing when this same ChatPage is embedded in the header's
            docked panel (assistant-chat-panel.tsx). Sharing the transcript's grid row is what keeps
            it above the composer's own `auto` row by construction: there is no offset to keep in
            sync with the composer's variable height.

            Withheld in the centred empty state (C1): there is no conversation to jump to yet, and
            `grid-row: 1` means nothing while the pane is a flex column — the button would become a
            third flex item wedged between the welcome group and the composer, breaking the very
            grouping the centred state exists to create. */}
          {!showLoadingState &&
            !showNoProviderState &&
            composerMode !== 'centered' &&
            !isPinnedToBottom && (
              <div className='wzJumpToLatest'>
                <EuiButtonIcon
                  className='wzJumpToLatestButton'
                  // `arrowDown`, not `sortDown`: both read correctly, but this one is already used
                  // elsewhere in this plugin (result-table.tsx's row expander), so it is proven
                  // present in whichever EUI version the host platform bundles.
                  iconType='arrowDown'
                  display='base'
                  // `m` (32px), not EUI's default `s` (24): at 24 the circle was smaller than the
                  // 32px comfortable-hit-target floor and read as a stray glyph floating over the
                  // transcript rather than as a control (audit §3.2). It is also centred over the
                  // measure now (`.wzJumpToLatest`, chat-page.scss) instead of parked in the
                  // corner.
                  size='m'
                  color='text'
                  onClick={handleJumpToLatest}
                  aria-label={i18n.translate(
                    'wazuhAiAssistant.chat.jumpToLatest',
                    {
                      defaultMessage: 'Jump to latest',
                    },
                  )}
                />
              </div>
            )}

          {/* Composer row: the grid's `auto` row (`.wzChatPane` above), a real flow sibling of the
            transcript, never an overlay — see the layout-contract comment above `privacyBadgeLabel`.
            `.wzComposerRow` (chat-page.scss) is the composer's OWN ceiling (`max-height:
            $wzComposerMaxHeight`, internal scroll past that); the textarea's independent 5-row
            autogrow cap lives in chat-input.tsx. */}
          {!showLoadingState && !showNoProviderState && (
            <div
              ref={composerRowRef}
              onTransitionEnd={handleComposerTransitionEnd}
              // `wzComposerRow--roomy` (iteration-4 item A) is derived straight from
              // `enableWelcomeComposer` rather than a new prop of its own: that prop already IS the
              // "is this the full-page surface or the 600-900px header sidecar" signal (see its own
              // doc comment above), and the docked composer's two-row floor is exactly the thing the
              // sidecar cannot afford. `.wzComposerRow--roomy .wzComposerTextarea` (chat-page.scss)
              // is the only rule this class exists to scope.
              className={[
                'wzComposerRow',
                hasProviders ? '' : 'wzComposerRow-isDisabled',
                enableWelcomeComposer ? 'wzComposerRow--roomy' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* `.wzComposerMeasure` alongside the shared measure class: it owns the composer's
                own gutters (chat-page.scss), which is all it is left carrying now that the composer
                shares ONE measure with the transcript in both states. It used to hold a compact
                `min(90%, 680px)` centred width that tweened back to the shared measure over the
                travel; that width was the empty state's third competing edge (audit §1.1), so it is
                gone and the tween with it. The vertical FLIP travel is untouched. */}
              <div className='wzContentMeasure wzComposerMeasure'>
                {/* `.wzComposerPanel` (chat-page.scss) supplies the shared `wzPanel` idiom — the
                  redesign's 12px radius and an 8px inset — in place of a raw EuiPanel's own 4px
                  radius plus an inline `marginBottom`. `paddingSize`/`hasBorder`/`hasShadow` stay
                  as the props EUI needs to not paint its own competing chrome. */}
                <EuiPanel
                  className='wzComposerPanel'
                  color='plain'
                  hasBorder
                  hasShadow={false}
                  paddingSize='s'
                >
                  {/* Composer floor and ceiling (contract §2): the textarea (chat-input.tsx) owns
                    its own one-line floor and 5-row autogrow cap; the controls row below it is a
                    normal flow sibling, in-panel, BELOW the field — never a second layer over it.
                    That stacking (not an absolute overlay) is what keeps the placeholder from ever
                    being squeezed under one line box. */}
                  <ChatInput
                    ref={chatInputRef}
                    value={inputText}
                    onChange={setInputText}
                    disabled={!hasProviders}
                    isGenerating={isGenerating}
                    onSend={handleSend}
                  />
                  {/* No `EuiSpacer` here any more (iteration-4 item A): the field's own bottom
                    padding plus the controls row's `gutterSize='s'` already separated them, and
                    the spacer on top of that was the extra few px that made the docked composer
                    feel taller than its "2-row floor" was supposed to read. */}
                  <EuiFlexGroup
                    alignItems='center'
                    gutterSize='s'
                    responsive={false}
                    wrap
                  >
                    {hasProviders && assistantSettings && (
                      <>
                        {/* The pill itself no longer carries the full explainer as a hover
                          tooltip — that turned "click to toggle" into "hover through a wall
                          of text first". `onClickAriaLabel` (set on `privacyChip` above) still
                          covers the click affordance for a11y. The explanation now lives on the
                          discrete ⓘ immediately after it, on demand. */}
                        <EuiFlexItem grow={false}>{privacyChip}</EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiIconTip
                            type='iInCircle'
                            color='subdued'
                            size='s'
                            aria-label={i18n.translate(
                              'wazuhAiAssistant.chat.privacy.explainerAriaLabel',
                              {
                                defaultMessage: 'About privacy mode',
                              },
                            )}
                            content={
                              assistantSettings.userCanOverride ? (
                                privacyExplainerText
                              ) : (
                                <>
                                  {privacyExplainerText}
                                  <br />
                                  {i18n.translate(
                                    'wazuhAiAssistant.chat.privacy.adminSet',
                                    {
                                      defaultMessage: 'Set by administrator',
                                    },
                                  )}
                                </>
                              )
                            }
                          />
                        </EuiFlexItem>
                      </>
                    )}
                    {/* Explicit grow spacer (was a bare `<EuiFlexItem />` relying on `grow`
                          defaulting to true) pushes the provider/send cluster to the far right.
                          The hairline divider that used to separate it from the privacy controls
                          is gone (iteration-4 item 2): the picker is now its own clickable text
                          button rather than an inline `<select>`, and reads as a distinct control
                          without needing a rule drawn next to it. */}
                    <EuiFlexItem grow />
                    <EuiFlexItem grow={false}>
                      <EuiFlexGroup
                        alignItems='center'
                        gutterSize='s'
                        responsive={false}
                      >
                        {hasProviders && (
                          <EuiFlexItem grow={false}>
                            <ProviderPicker
                              providers={providers}
                              selectedProviderId={selectedProviderId}
                              onProviderChange={onProviderChange}
                              onManageProviders={onManageProviders}
                              activeConversationId={activeConversationId}
                            />
                          </EuiFlexItem>
                        )}
                        <EuiFlexItem grow={false}>
                          {isGenerating ? (
                            <EuiButtonIcon
                              className='wzComposerSendButton'
                              iconType='cross'
                              color='danger'
                              // 'm', matching the Send button's own size (iteration-4 item A) —
                              // this button replaces Send in the exact same row slot while
                              // generating, and a smaller icon here shrank that slot's height
                              // between the two states.
                              size='m'
                              // 'base' (bordered, unfilled) — a deliberate step down from the
                              // Send button's filled 'fill': Stop is a real interrupt but not the
                              // row's primary action, and a second filled/colored button in the
                              // same slot the instant generation starts would read as the
                              // composer's emphasis flipping to "danger" by default. Verified
                              // against this fork's OUI build (button_icon.tsx's
                              // `displayToClassNameMap`), which does define 'base' alongside
                              // 'empty'/'fill' — same three-value `display` union EUI ships.
                              display='base'
                              onClick={handleStop}
                              aria-label={i18n.translate(
                                'wazuhAiAssistant.chat.stopButton',
                                {
                                  defaultMessage: 'Stop',
                                },
                              )}
                            />
                          ) : (
                            <EuiButtonIcon
                              className='wzComposerSendButton'
                              iconType='arrowUp'
                              color='primary'
                              // 'm', not 's' (iteration-4 item A): against the roomier two-row
                              // field the small size read as undersized for the row's own height.
                              size='m'
                              // Filled only once there is something to send (`canSend`); an empty
                              // composer now gets the same unfilled 'empty' display Stop's sibling
                              // slot uses instead of a filled-but-disabled button, which used to
                              // read as broken rather than "nothing typed yet".
                              display={canSend ? 'fill' : 'empty'}
                              onClick={() => chatInputRef.current?.send()}
                              disabled={!canSend}
                              aria-label={i18n.translate(
                                'wazuhAiAssistant.chat.sendButton',
                                {
                                  defaultMessage: 'Send',
                                },
                              )}
                            />
                          )}
                        </EuiFlexItem>
                      </EuiFlexGroup>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
