import React from 'react';
import { EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
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
   * Re-asks the last question IN PLACE: the unfinished answer is dropped and replaced.
   * `undefined` while a turn is generating.
   */
  onRetryLastTurn?: () => void;
  /**
   * Re-asks the question behind an OLDER failed/interrupted turn, by appending it to the end of the
   * conversation as a new turn (`chat-page.tsx`'s `handleAskAgain`).
   *
   * Why an append and not an in-place retry: a failed turn stops being the last one the moment the
   * reader asks anything else, and until now that silently took its retry action away with it — the
   * one turn most likely to need retrying was the one that could no longer be retried, and the only
   * route back was to retype the question. Rewriting the middle of a transcript is genuinely not
   * something this component supports (every later turn's tool history was built on top of it), so
   * the action asks the same question AGAIN, at the end, where the answer belongs. `undefined`
   * while a turn is generating.
   */
  onRetryTurn?: (messageId: string) => void;
  /**
   * Real measured height (px) of the scrolling transcript pane — layout contract §4's "page size
   * steps 5 → 10 above 900px of transcript height". Threaded straight through to every
   * MessageBubble/ResultTable; see result-table.tsx's own doc comment on the same-named prop for
   * how it feeds the table's initial page size. chat-page.tsx measures the pane with a
   * `ResizeObserver` and supplies this on every render (confirmed by reading it — see its
   * `transcriptHeightPx` state and where it passes this prop down); it is optional here only
   * because jsdom has no `ResizeObserver`, so it stays `0`/`undefined` in tests and the pre-redesign
   * default page size applies there.
   */
  transcriptHeightPx?: number;
  /**
   * Threaded down to every MessageBubble's ResultTable: fired when a table's rows-per-page control
   * changes, so chat-page.tsx can re-pin the transcript pane to the freshly-grown card's bottom. A
   * stable callback (chat-page holds it via `useCallback`), so it never defeats this component's
   * memo. See result-table.tsx's `onRowsPerPageChange` doc comment for the bug it fixes.
   */
  onTableRowsPerPageChange?: () => void;
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
 *  - `onTableRowsPerPageChange`: chat-page holds it via `useCallback` with a stable dependency list,
 *    so it is the same function instance across a keystroke re-render, not just "equal".
 * Default (shallow) React.memo comparison is therefore sufficient; no custom comparator needed.
 */
export const MessageList = React.memo<MessageListProps>(function MessageList({
  messages,
  resolveDiscoverUrl,
  resolveSecurityAnalyticsUrl,
  onRetryLastTurn,
  onRetryTurn,
  transcriptHeightPx,
  onTableRowsPerPageChange,
}) {
  const lastMessage = messages[messages.length - 1];
  /** Distinct from "Retry" on purpose: an older turn is re-asked at the END of the conversation
   * (see `onRetryTurn`), and calling that "Retry" would promise an in-place replacement it does not
   * perform. */
  const askAgainLabel = i18n.translate('wazuhAiAssistant.chat.askAgain', {
    defaultMessage: 'Ask again',
  });
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
              // Zero-row tables are suppressed at render time (message-bubble.tsx's
              // `renderedTable`), so a suppressed table must not widen its row either — a --wide
              // row around prose-only content would center it on the 1300px table measure for no
              // visible reason.
              message.table && message.table.rows.length > 0
                ? 'wzMessageRow wzMessageRow--wide'
                : 'wzMessageRow'
            }
          >
            <MessageBubble
              message={message}
              resolveDiscoverUrl={resolveDiscoverUrl}
              resolveSecurityAnalyticsUrl={resolveSecurityAnalyticsUrl}
              // The last turn keeps the in-place retry it always had. An OLDER unfinished turn
              // (failed or interrupted) now keeps an action too — "Ask again", which appends the
              // question instead of rewriting the middle of the transcript. A completed older turn
              // gets nothing, exactly as before.
              onRetry={
                index === messages.length - 1
                  ? onRetryLastTurn
                  : onRetryTurn &&
                    message.role === 'assistant' &&
                    (message.failureReason || message.interrupted)
                  ? () => onRetryTurn(message.id)
                  : undefined
              }
              retryLabel={
                index === messages.length - 1 ? undefined : askAgainLabel
              }
              transcriptHeightPx={transcriptHeightPx}
              onTableRowsPerPageChange={onTableRowsPerPageChange}
            />
          </div>
          {/* One turn boundary = one 32px breath (EuiSpacer size='xl') — iteration-4 audit, P0 item
              2: raised from 24px ('l') now that the P0 flow-root fix on `.wzMessageRow`
              (chat-page.scss) stops this spacer from silently collapsing to 16px via the
              margin-collapse leak. Intra-turn spacing inside a bubble stays 's'. */}
          {index < messages.length - 1 && <EuiSpacer size='xl' />}
        </React.Fragment>
      ))}
      {/* A conversation that ENDS on a question is an unanswered turn: the page was reloaded or
          navigated away from while the answer was streaming, so nothing survived to be marked
          interrupted (that happens in the browser, and the browser went away). The question itself
          was saved before generating started, so this is the only trace left — and without this the
          user was left staring at their own question with no way to ask it again. */}
      {lastMessage?.role === 'user' && (
        <>
          {/* This spacer used to render at 0px instead of its intended 8px, via the same
              margin-collapse leak the P0 flow-root fix on `.wzMessageRow` (chat-page.scss)
              corrects — the leak was general to any `EuiFlexGroup`-rooted content sitting inside a
              bare `.wzMessageRow`, and `InterruptedTurnNotice` below is exactly that. */}
          <EuiSpacer size='s' />
          {/* `wzInterruptedNoticeRow` (chat-page.scss, iteration-4 audit P1 item 8): this standalone
              notice has no avatar column of its own, so without it the text rendered at the row's
              own left edge (avatarX) instead of the prose rail every other line above it sits on
              (avatarX + 40px). */}
          <div className='wzMessageRow wzInterruptedNoticeRow'>
            <InterruptedTurnNotice onRetry={onRetryLastTurn} />
          </div>
        </>
      )}
    </div>
  );
});
