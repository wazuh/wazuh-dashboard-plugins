import React from 'react';
import { EuiSpacer } from '@elastic/eui';
import {
  InterruptedTurnNotice,
  MessageBubble,
  UiChatMessage,
} from './message-bubble';
import { ResolveDiscoverUrl } from './discover-link';
import { ResolveSecurityAnalyticsUrl } from './security-analytics-link';

interface MessageListProps {
  messages: UiChatMessage[];
  /** Basepath-prepended URL for the Wazuh mark, used as the assistant avatar. */
  aiAvatarUrl: string;
  /** Threaded down to every MessageBubble's ResultTable; see discover-link.tsx. */
  resolveDiscoverUrl: ResolveDiscoverUrl;
  /** Threaded down to every MessageBubble's ResultTable; see security-analytics-link.tsx. */
  resolveSecurityAnalyticsUrl: ResolveSecurityAnalyticsUrl;
  /**
   * Re-asks the last question. Applies to the LAST turn only — retrying an older one would mean
   * rewriting the middle of the conversation, which nothing here supports. `undefined` while a turn
   * is generating.
   */
  onRetryLastTurn?: () => void;
}

/**
 * Pure list rendering only — auto-scroll is owned by chat-page.tsx (its `scrollPaneRef` pinning
 * on the middle scroll-area div, the conversation's one true scroll container). This component
 * previously carried its own sentinel + `scrollIntoView` mechanism; it was removed because
 * it detected its scrollable ancestor ONCE at mount (usually
 * before the scroll area had anything to scroll), so its "is the user near the bottom" listener
 * attached to the wrong element and could fight the page-level pinning.
 *
 * Memoized (perf): ChatPage re-renders on every keystroke (the input's
 * text lives in its own useState there), which would otherwise re-render this whole list —
 * every MessageBubble, every ResultTable, up to 500 rows each — on every single character typed.
 * The three props below are all referentially stable across a keystroke-triggered ChatPage
 * render:
 *  - `messages`: only replaced by `updateMessages` (new message/delta/table/etc.), never by
 *    anything input-related.
 *  - `aiAvatarUrl`: a `string` — recomputed each ChatPage render from `core.http.basePath`, but
 *    `Object.is`/`===` compares primitive strings BY VALUE, so an unchanged basePath still
 *    compares equal even though it's a "new" string each render.
 *  - `resolveDiscoverUrl`: ChatPage holds it via `useState(() => createDiscoverUrlResolver(core))`
 *    (the lazy-initializer form, run once on mount), so it is the exact same function instance for
 *    the component's whole lifetime, not just "equal" — confirmed by reading chat-page.tsx.
 * Default (shallow) React.memo comparison is therefore sufficient; no custom comparator needed.
 */
export const MessageList = React.memo<MessageListProps>(function MessageList({
  messages,
  aiAvatarUrl,
  resolveDiscoverUrl,
  resolveSecurityAnalyticsUrl,
  onRetryLastTurn,
}) {
  const lastMessage = messages[messages.length - 1];
  return (
    <div>
      {messages.map((message, index) => (
        <React.Fragment key={message.id}>
          <MessageBubble
            message={message}
            aiAvatarUrl={aiAvatarUrl}
            resolveDiscoverUrl={resolveDiscoverUrl}
            resolveSecurityAnalyticsUrl={resolveSecurityAnalyticsUrl}
            onRetry={
              index === messages.length - 1 ? onRetryLastTurn : undefined
            }
          />
          {index < messages.length - 1 && <EuiSpacer size='m' />}
        </React.Fragment>
      ))}
      {/* A conversation that ENDS on a question is an unanswered turn: the page was reloaded or
          navigated away from while the answer was streaming, so nothing survived to be marked
          interrupted (that happens in the browser, and the browser went away). The question itself
          was saved before generating started, so this is the only trace left — and without this the
          user was left staring at their own question with no way to ask it again. */}
      {lastMessage?.role === 'user' && (
        <>
          <EuiSpacer size='s' />
          <InterruptedTurnNotice onRetry={onRetryLastTurn} />
        </>
      )}
    </div>
  );
});
