import React from 'react';
import {
  EuiPanel,
  EuiText,
  EuiTextColor,
  EuiSpacer,
  EuiLoadingSpinner,
  EuiFlexGroup,
  EuiFlexItem,
  EuiAccordion,
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
   * The tool calls this turn ran, shown as a collapsed "query executed" panel so the reader can see
   * exactly what was asked of the indexer or the Manager API rather than having to trust the prose.
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

  const bubbleContent = (
    <>
      {isUser || message.isStreaming ? (
        // aria-live only for the assistant's streaming text (never the user bubble, which this
        // branch also covers): announces incoming delta tokens to screen readers, which
        // otherwise stay silent for the whole stream since nothing else here changes focus.
        <div
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
        <EuiText size='s'>
          <EuiMarkdownFormat>{message.content}</EuiMarkdownFormat>
        </EuiText>
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
      {/* What was actually run, collapsed by default: the answer is only as trustworthy as the
            query behind it, and an analyst has to be able to check that query without reading
            server logs. Shows each tool call's real-form arguments and, for an indexer search, the
            executed DSL the table carries (the same one "Open in Discover" uses). */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <>
          <EuiSpacer size='s' />
          <EuiAccordion
            id={`wzAiQuery-${message.id}`}
            paddingSize='s'
            buttonContent={
              <EuiText size='xs'>
                <EuiTextColor color='subdued'>
                  {i18n.translate('wazuhAiAssistant.chat.queryDetails', {
                    defaultMessage:
                      '{count, plural, one {# query executed} other {# queries executed}}',
                    values: { count: message.toolCalls.length },
                  })}
                </EuiTextColor>
              </EuiText>
            }
          >
            {message.toolCalls.map(toolCall => (
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
                  overflowHeight={240}
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
                  overflowHeight={240}
                >
                  {JSON.stringify(message.table.discover.dsl, null, 2)}
                </EuiCodeBlock>
              </>
            )}
          </EuiAccordion>
        </>
      )}
      {/* An interrupted answer is labelled as one rather than left looking complete — the whole
            point is that the reader can tell this text stops mid-thought on purpose. */}
      {message.interrupted && !message.isStreaming && (
        <>
          <EuiSpacer size='xs' />
          <InterruptedTurnNotice onRetry={onRetry} />
        </>
      )}
    </>
  );

  const bubble = (
    <EuiFlexItem grow={false} style={{ maxWidth: '75%', minWidth: 180 }}>
      {isUser ? (
        <EuiPanel
          color='plain'
          paddingSize='m'
          hasShadow={false}
          hasBorder
          style={{ borderRadius: 14 }}
        >
          {bubbleContent}
        </EuiPanel>
      ) : (
        <div style={{ padding: '8px 0' }}>{bubbleContent}</div>
      )}
      <EuiText
        size='xs'
        color='subdued'
        textAlign={isUser ? 'right' : 'left'}
        className='wzAiAssistantMessageTimestamp'
      >
        <p style={{ margin: '2px 4px 0' }}>
          {formatTimestamp(message.createdAt)}
        </p>
      </EuiText>
    </EuiFlexItem>
  );

  const avatarItem = (
    <EuiFlexItem grow={false}>
      <EuiFlexGroup direction='column' alignItems='center' gutterSize='xs'>
        <EuiFlexItem grow={false}>{avatar}</EuiFlexItem>
        {message.isStreaming && (
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner
              size='s'
              aria-label={i18n.translate('wazuhAiAssistant.chat.generating', {
                defaultMessage: 'Generating response',
              })}
            />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </EuiFlexItem>
  );

  return (
    // wzMsgRow (chat-page.tsx's CHAT_SURFACE_STYLES): a reduced-motion-guarded fade/slide-up that
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
