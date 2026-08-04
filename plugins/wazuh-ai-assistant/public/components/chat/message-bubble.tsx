import React, { useState } from 'react';
import {
  EuiPanel,
  EuiText,
  EuiTextColor,
  EuiSpacer,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiAvatar,
  EuiButtonEmpty,
  EuiCodeBlock,
  EuiLoadingContent,
  EuiMarkdownFormat,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ChatRole, TableSpec, ToolCall } from '../../../common/types';
import { ResultTable } from './result-table';
import { ResolveDiscoverUrl } from './discover-link';
import { ResolveSecurityAnalyticsUrl } from './security-analytics-link';
import { describeToolCall } from './tool-call-label';

/**
 * "This turn was cut short" affordance, rendered in two places: inside an interrupted assistant
 * bubble, and on its own (message-list.tsx) for a question whose answer never arrived at all — a
 * reload or a navigation mid-answer kills the page before anything can mark the assistant message,
 * so the only evidence left is a conversation that ends with an unanswered question.
 */
export const InterruptedTurnNotice: React.FC<{ onRetry?: () => void }> = ({
  onRetry,
}) => (
  <EuiFlexGroup
    gutterSize='s'
    alignItems='center'
    responsive={false}
    justifyContent='flexStart'
  >
    <EuiFlexItem grow={false}>
      <EuiText size='xs'>
        <EuiTextColor color='subdued'>
          {i18n.translate('wazuhAiAssistant.chat.interrupted', {
            defaultMessage: 'Response interrupted',
          })}
        </EuiTextColor>
      </EuiText>
    </EuiFlexItem>
    {onRetry && (
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty
          size='xs'
          flush='both'
          iconType='refresh'
          onClick={onRetry}
        >
          {i18n.translate('wazuhAiAssistant.chat.retry', {
            defaultMessage: 'Retry',
          })}
        </EuiButtonEmpty>
      </EuiFlexItem>
    )}
  </EuiFlexGroup>
);

export interface UiChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  table?: TableSpec;
  /** True while this assistant message is still receiving delta events. */
  isStreaming?: boolean;
  /** Transient progress line from a `status` stream event (e.g. "Querying Wazuh..."). */
  statusMessage?: string;
  createdAt: number;
  /**
   * The tool calls this turn ran, shown as small provenance chips in the message meta row so the
   * reader can see exactly what was asked of the indexer or the Manager API rather than having to
   * trust the prose — the raw name/arguments/DSL are one click deeper, never on screen unbidden.
   * Real-form arguments (the server reverses pseudonyms before emitting the `tool_call` event).
   */
  toolCalls?: ToolCall[];
  /**
   * The turn ended before the answer was complete — the user pressed Stop, navigated away, or the
   * connection dropped. Persisted, so a resumed conversation still shows which answer is a partial
   * one instead of presenting it as finished.
   */
  interrupted?: boolean;
}

interface MessageBubbleProps {
  message: UiChatMessage;
  /** Threaded down to ResultTable's "Open in Discover" link; see discover-link.tsx. */
  resolveDiscoverUrl: ResolveDiscoverUrl;
  /** Threaded down to ResultTable's "Open in Security Analytics" link; see
   * security-analytics-link.tsx. */
  resolveSecurityAnalyticsUrl: ResolveSecurityAnalyticsUrl;
  /**
   * Re-asks the question this interrupted answer belongs to. Absent when retrying is not possible
   * right now (another turn is generating, or this is not the conversation's last turn), in which
   * case the interrupted notice is shown without an action.
   */
  onRetry?: () => void;
}

function formatTimestamp(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Renders a single chat turn. User messages are always plain text. Assistant messages are
 * plain text while still streaming (re-parsing Markdown on every delta token is wasteful and
 * can flicker), then switch to EuiMarkdownFormat once the message has finished streaming so
 * bold text, lists, and code blocks in the model's response render correctly.
 */
/**
 * Memoized (perf): without this, every keystroke in the chat input
 * re-renders ChatPage, which re-renders MessageList, which re-renders EVERY MessageBubble
 * (including their ResultTables, up to 500 rows each) even though none of their own props
 * changed. `message`/`resolveDiscoverUrl` are all referentially stable across a
 * keystroke (see message-list.tsx's own memo doc comment for why), so the default shallow
 * prop comparison is enough here — no custom comparator needed.
 */
const MessageBubbleComponent: React.FC<MessageBubbleProps> = ({
  message,
  resolveDiscoverUrl,
  resolveSecurityAnalyticsUrl,
  onRetry,
}) => {
  const isUser = message.role === 'user';
  const isWaitingForFirstToken =
    !isUser && message.isStreaming === true && message.content === '';
  const toolCalls = message.toolCalls ?? [];
  // One shared raw view for every provenance chip on this bubble (not one per chip): clicking any
  // chip toggles the same panel, which is exactly the content the old "N queries executed"
  // accordion showed — default collapsed, so no JSON is ever on screen unbidden.
  const [isRawViewOpen, setIsRawViewOpen] = useState(false);
  const rawViewId = `wzAiQueryRaw-${message.id}`;
  // color="plain" keeps both avatars on the same neutral background, so the pair reads as one
  // set instead of picking up EUI's auto-assigned per-name colors.
  const avatar = isUser ? (
    <EuiAvatar
      size='m'
      iconType='user'
      color='plain'
      name={i18n.translate('wazuhAiAssistant.chat.userAvatarName', {
        defaultMessage: 'You',
      })}
    />
  ) : (
    // Initials, not an image: the Wazuh mark was dropped here because the app chrome already
    // brands the page. `name` backs both the aria-label/title and the rendered initials, and
    // initialsLength=2 keeps it as "AI" rather than EUI's default single-letter "A".
    <EuiAvatar
      size='m'
      color='plain'
      initialsLength={2}
      name={i18n.translate('wazuhAiAssistant.chat.aiAvatarName', {
        defaultMessage: 'AI',
      })}
    />
  );

  // Prose keeps a fixed reading measure even when the turn is wide. A turn carrying a table
  // widens to the full column so the table fits (see the wrapper below), and without this the
  // answer's sentences inherited that width and ran to ~117 characters a line — roughly 60% past
  // the point where the eye reliably finds the next line, which reads as a wall of text. Only
  // block content (the table, the raw query view) is allowed to use the extra width.
  const PROSE_MEASURE = 720;
  const proseStyle: React.CSSProperties = { maxWidth: PROSE_MEASURE };

  const bubbleContent = (
    <>
      {isUser || message.isStreaming ? (
        // aria-live only for the assistant's streaming text (never the user bubble, which this
        // branch also covers): announces incoming delta tokens to screen readers, which
        // otherwise stay silent for the whole stream since nothing else here changes focus.
        <div
          style={proseStyle}
          {...(!isUser
            ? {
                'aria-live': 'polite' as const,
                'aria-atomic': 'false' as const,
              }
            : {})}
        >
          <EuiText size='s'>
            {/* Shown only before real content has arrived; a delta event clears statusMessage. */}
            {message.statusMessage && !message.content && (
              <p style={{ margin: 0, fontStyle: 'italic' }}>
                <EuiTextColor color='subdued'>
                  {message.statusMessage}
                </EuiTextColor>
              </p>
            )}
            {/* Waiting for the first token: a bubble with nothing in it read as a broken empty
                  box, especially on a turn that runs tool calls first and can sit silent for
                  seconds. Placeholder lines say "something is coming" the way every chat client
                  does. Replaced by real text the moment a delta arrives. */}
            {isWaitingForFirstToken ? (
              <EuiLoadingContent lines={2} />
            ) : (
              <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                {message.content}
              </p>
            )}
          </EuiText>
        </div>
      ) : (
        <div style={proseStyle}>
          <EuiText size='s'>
            <EuiMarkdownFormat>{message.content}</EuiMarkdownFormat>
          </EuiText>
        </div>
      )}
      {message.table && (
        <>
          <EuiSpacer size='s' />
          <ResultTable
            spec={message.table}
            resolveDiscoverUrl={resolveDiscoverUrl}
            resolveSecurityAnalyticsUrl={resolveSecurityAnalyticsUrl}
          />
        </>
      )}
      {/* What was actually run, collapsed by default (see the provenance chips in the meta row
            below, which toggle this same panel): the answer is only as trustworthy as the query
            behind it, and an analyst has to be able to check that query without reading server
            logs. Shows each tool call's real-form arguments and, for an indexer search, the
            executed DSL the table carries (the same one "Open in Discover" uses). */}
      {toolCalls.length > 0 && isRawViewOpen && (
        <>
          <EuiSpacer size='s' />
          <div id={rawViewId}>
            {toolCalls.map(toolCall => (
              <div key={toolCall.id}>
                <EuiText size='xs'>
                  <strong>{toolCall.name}</strong>
                </EuiText>
                <EuiSpacer size='xs' />
                <EuiCodeBlock
                  language='json'
                  paddingSize='s'
                  fontSize='s'
                  isCopyable
                >
                  {JSON.stringify(toolCall.arguments, null, 2)}
                </EuiCodeBlock>
                <EuiSpacer size='s' />
              </div>
            ))}
            {message.table?.discover && (
              <>
                <EuiText size='xs'>
                  <strong>
                    {i18n.translate('wazuhAiAssistant.chat.queryIndex', {
                      defaultMessage: 'Index: {index}',
                      values: { index: message.table.discover.index },
                    })}
                  </strong>
                </EuiText>
                <EuiSpacer size='xs' />
                <EuiCodeBlock
                  language='json'
                  paddingSize='s'
                  fontSize='s'
                  isCopyable
                >
                  {JSON.stringify(message.table.discover.dsl, null, 2)}
                </EuiCodeBlock>
              </>
            )}
          </div>
        </>
      )}
    </>
  );

  const bubble = (
    <EuiFlexItem
      grow={false}
      style={{
        // The user turn keeps its 75% share (a question is always prose); the assistant turn
        // gets a readable 720px prose measure EXCEPT when it carries a result table, which uses
        // the full column width instead — a wide table squeezed into 75% of an already-narrow
        // column forced a horizontal scrollbar inside the table's own 400px scroller.
        maxWidth: isUser ? '75%' : message.table ? '100%' : 720,
        minWidth: 180,
      }}
    >
      {isUser ? (
        // The question is a discrete card; the answer is undecorated prose on the canvas, so the
        // two roles never read as the same kind of thing. `color='plain'` (empty shade) over the
        // page's own light-grey background is what actually separates them: a `subdued` fill sits
        // within ~2% luminance of that background and, with no border, made the question
        // effectively invisible. The border is the guarantee — it holds the edge in both themes
        // regardless of how close the two fills are, and matches the Home Overview's own
        // hairline-bordered, shadowless panel signature.
        <EuiPanel
          color='plain'
          paddingSize='m'
          hasShadow={false}
          hasBorder
          // The one deliberate radius override on the surface: a conversation turn reads as a
          // bubble, not as a data panel. Everything else uses EUI defaults (see chat-page.scss).
          style={{ borderRadius: 14 }}
        >
          {bubbleContent}
        </EuiPanel>
      ) : (
        <div style={{ padding: '8px 0' }}>{bubbleContent}</div>
      )}
      {/* Meta row: an interrupted-turn notice (assistant only, left of the timestamp) plus the
            timestamp plus, for an assistant turn that ran tool calls, one provenance chip per
            call — clicking any of them toggles the shared raw view above (default collapsed,
            wired via aria-expanded/aria-controls). Anchoring the interrupted notice here instead
            of as its own floating line keeps it attached to the turn it belongs to. */}
      <EuiFlexGroup
        gutterSize='xs'
        alignItems='center'
        responsive={false}
        justifyContent={isUser ? 'flexEnd' : 'flexStart'}
        wrap
      >
        {!isUser && message.interrupted && !message.isStreaming && (
          <EuiFlexItem grow={false}>
            <InterruptedTurnNotice onRetry={onRetry} />
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={false}>
          <EuiText
            size='xs'
            color='subdued'
            textAlign={isUser ? 'right' : 'left'}
            className='wzAiAssistantMessageTimestamp'
          >
            <p
              style={{
                margin: '4px 4px 0',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatTimestamp(message.createdAt)}
            </p>
          </EuiText>
        </EuiFlexItem>
        {!isUser &&
          toolCalls.map(toolCall => {
            const { short, full } = describeToolCall(toolCall, message.table);
            return (
              <EuiFlexItem grow={false} key={toolCall.id}>
                <EuiBadge
                  color='hollow'
                  iconType='search'
                  title={full}
                  onClick={() => setIsRawViewOpen(open => !open)}
                  onClickAriaLabel={i18n.translate(
                    'wazuhAiAssistant.chat.queryChipAriaLabel',
                    {
                      defaultMessage: 'Show the executed query: {label}',
                      values: { label: full },
                    },
                  )}
                  aria-expanded={isRawViewOpen}
                  aria-controls={rawViewId}
                >
                  {short}
                </EuiBadge>
              </EuiFlexItem>
            );
          })}
      </EuiFlexGroup>
    </EuiFlexItem>
  );

  // One loading indicator while streaming, not two: the avatar-mounted spinner that used to sit
  // alongside the in-bubble EuiLoadingContent skeleton/status line is gone — that pair read as two
  // independent "something is happening" signals for the same event.
  const avatarItem = (
    <EuiFlexItem grow={false}>
      <EuiFlexGroup direction='column' alignItems='center' gutterSize='xs'>
        <EuiFlexItem grow={false}>{avatar}</EuiFlexItem>
      </EuiFlexGroup>
    </EuiFlexItem>
  );

  return (
    // wzMsgRow (chat-page.scss): a reduced-motion-guarded fade/slide-up that
    // plays once when this row is first inserted into the DOM. Applying the class unconditionally
    // (not toggled by any state) is what keeps it a MOUNT-only effect — a later re-render of this
    // same MessageBubble instance (a streamed delta, a table arriving, etc.) never re-inserts the
    // element, so the CSS animation never restarts; only a genuinely NEW message (new `key` in
    // message-list.tsx, so a new DOM node) plays it again.
    <EuiFlexGroup
      className='wzMsgRow'
      justifyContent={isUser ? 'flexEnd' : 'flexStart'}
      gutterSize='s'
      responsive={false}
    >
      {isUser ? (
        <>
          {bubble}
          {avatarItem}
        </>
      ) : (
        <>
          {avatarItem}
          {bubble}
        </>
      )}
    </EuiFlexGroup>
  );
};

export const MessageBubble = React.memo(MessageBubbleComponent);
