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
  /**
   * Real measured height (px) of the scrolling transcript pane — layout contract §4's "page size
   * steps 5 → 10 above 900px of transcript height". Threaded straight through to every
   * MessageBubble/ResultTable; see result-table.tsx's own doc comment on the same-named prop for
   * why this is optional and, as of this redesign pass, never actually supplied by chat-page.tsx
   * (no such measurement exists there yet). Kept here so chat-page.tsx only needs to start passing
   * it, once it measures the pane, with no further prop-plumbing change on this end.
   */
  transcriptHeightPx?: number;
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
 * The props below are all referentially stable across a keystroke-triggered ChatPage
 * render:
 *  - `messages`: only replaced by `updateMessages` (new message/delta/table/etc.), never by
 *    anything input-related.
 *  - `resolveDiscoverUrl`: ChatPage holds it via `useState(() => createDiscoverUrlResolver(core))`
 *    (the lazy-initializer form, run once on mount), so it is the exact same function instance for
 *    the component's whole lifetime, not just "equal" — confirmed by reading chat-page.tsx.
 *  - `transcriptHeightPx`: a plain number (or `undefined`), so it is trivially shallow-equal across
 *    a keystroke re-render regardless of how/whether chat-page.tsx ever starts measuring it.
 * Default (shallow) React.memo comparison is therefore sufficient; no custom comparator needed.
 */
export const MessageList = React.memo<MessageListProps>(function MessageList({
  messages,
  resolveDiscoverUrl,
  resolveSecurityAnalyticsUrl,
  onRetryLastTurn,
  transcriptHeightPx,
}) {
  const lastMessage = messages[messages.length - 1];
  return (
    // `.wzTranscriptContent` (chat-page.scss/chat-page.tsx): this component is now that wrapper's
    // sibling, not `.wzContentMeasure`'s descendant — each row below centres itself independently
    // via `.wzMessageRow`/`.wzMessageRow--wide`, which is what actually lets a table-bearing turn
    // reach past the shared 1060px measure (layout contract §5).
    <div>
      {messages.map((message, index) => (
        <React.Fragment key={message.id}>
          <div
            className={
              message.table ? 'wzMessageRow wzMessageRow--wide' : 'wzMessageRow'
            }
          >
            <MessageBubble
              message={message}
              resolveDiscoverUrl={resolveDiscoverUrl}
              resolveSecurityAnalyticsUrl={resolveSecurityAnalyticsUrl}
              onRetry={
                index === messages.length - 1 ? onRetryLastTurn : undefined
              }
              transcriptHeightPx={transcriptHeightPx}
            />
          </div>
          {/* One turn = one 24px breath (EuiSpacer size='l'), matching the rhythm the conversation
              header and welcome state also use — intra-turn spacing inside a bubble stays 's'. */}
          {index < messages.length - 1 && <EuiSpacer size='l' />}
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
          <div className='wzMessageRow'>
            <InterruptedTurnNotice onRetry={onRetryLastTurn} />
          </div>
        </>
      )}
    </div>
  );
});
