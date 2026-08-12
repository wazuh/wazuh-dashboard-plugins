import React, { useMemo, useState } from 'react';
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
  EuiCallOut,
  EuiCodeBlock,
  EuiLoadingContent,
  EuiMarkdownFormat,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ChatRole, TableSpec, ToolCall } from '../../../common/types';
import { ResultTable, ResultTableProvenanceChip } from './result-table';
import { DiscoverLink, ResolveDiscoverUrl } from './discover-link';
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
  /**
   * The graceful-failure handoff (server/tools/suggest-discover-query.ts / issue
   * 13-suggested-query-discover-handoff.md): set from a `suggested_query` stream event instead of
   * `table` when the model determined the data asked about is out of its reach for every tool it
   * has, and offered a query the user can run themselves in Discover instead of guessing.
   * `reason` is the model's own plain-language explanation, shown next to the link — not always
   * verbatim: chat.ts appends a fixed disclosure sentence whenever the emitted `dsl` lost
   * field-level filters (or its time window) relative to what the model asked to show, so the
   * two can never silently diverge (see common/types.ts's `suggested_query` doc comment).
   */
  suggestedQuery?: {
    index: string;
    dsl: Record<string, unknown>;
    reason: string;
  };
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
  /** Passed straight through to this message's ResultTable — see that component's own doc
   * comment on the same-named prop for why it is optional and currently always `undefined`. */
  transcriptHeightPx?: number;
}

function formatTimestamp(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * SECURITY (#8890): the finished answer below is model output built from tool results, which
 * can themselves carry attacker-influenced text (a log line, a rule description, a filename).
 * `EuiMarkdownFormat` is otherwise given no plugin overrides, so its default renderer draws
 * `![alt](url)` as a live `<img>` (an uncontrolled outbound fetch to whatever URL ended up in
 * the model's answer) and — depending on the exact EUI/remark-rehype build the host platform
 * bundles — can interpret raw inline HTML. An assistant answer is analytical prose; it has no
 * legitimate need to embed a remote image or a raw HTML element.
 *
 * EUI does expose `getDefaultEuiMarkdownProcessingPlugins`/`parsingPluginList` overrides for
 * exactly this kind of restriction, and that is the preferred fix — but this plugin is bundled
 * against whichever `@elastic/eui` version the host `wazuh-dashboard` platform ships (not a
 * version pinned in this repo), and that version cannot be resolved or exercised from this
 * worktree (no installed `node_modules`, no way to run a real render to confirm the plugin-list
 * shape holds for the bundled version). Rather than hard-code an internal EUI plugin API this
 * plugin cannot verify against its actual runtime, this sanitizes the STRING before it reaches
 * `EuiMarkdownFormat`, the same "mechanical, version-independent guarantee" already used for the
 * markdown-table backstop (see server/tools/markdown-table-filter.ts's doc comment). Fenced code
 * blocks and inline code spans are left untouched, so a literal `<img>` or `![]()` a user is
 * reading about in a code sample still displays as written.
 */
export function sanitizeAssistantMarkdown(content: string): string {
  // Split on fenced code blocks (```...```) and inline code spans (`...`); the capturing group
  // keeps each code segment as its own array element, interleaved with the surrounding prose.
  // Odd indices are always the captured (code) segments — see the .map below.
  const segments = content.split(/(```[\s\S]*?```|`[^`\n]*`)/g);
  return segments
    .map((segment, index) =>
      index % 2 === 1 ? segment : sanitizeProseSegment(segment),
    )
    .join('');
}

function sanitizeProseSegment(segment: string): string {
  return (
    segment
      // Markdown images (inline and reference-style) — strip entirely rather than degrading to a
      // link, since a bare URL the model copied from tool data is exactly the kind of attacker-
      // influenced text this guards against too.
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/!\[[^\]]*\]\[[^\]]*\]/g, '')
      // Raw HTML tags (open, close, self-closing) — the leading-letter requirement after `<`/`</`
      // is what real HTML tags require, so ordinary prose use of `<`/`>` (e.g. "value < 5") never
      // matches and passes through untouched.
      .replace(/<\/?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^<>]*)?\/?>/g, '')
      // Markdown links: keep the label, drop the target unless it's an explicit http(s) URL — a
      // "plain link... subject to a scheme check" (never javascript:/data:/vbscript:/a bare path).
      // The trailing `\)+` (not just `\)`) also consumes a stray extra ")" that a malicious target
      // itself containing an unmatched "(" (e.g. "javascript:alert(1)") would otherwise leave
      // behind in the rendered text.
      .replace(/\[([^\]]*)\]\((?!https?:\/\/)[^)]*\)+/gi, '$1')
  );
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
  transcriptHeightPx,
}) => {
  const isUser = message.role === 'user';
  const isWaitingForFirstToken =
    !isUser && message.isStreaming === true && message.content === '';
  const toolCalls = message.toolCalls ?? [];
  // Provenance chips move UP into the result card's own header once a table exists (layout
  // contract §4: "the tool call renders BELOW the table it produced; it should become a chip in
  // the card header") — ResultTable renders them there instead. Below-bubble chips stay exactly
  // as before for the (common) case a turn ran tool calls but produced no table at all (a count
  // answer, a suggested-query handoff, or a table still held back by chat-page.tsx pending the
  // first answer token — see chat-page.test.tsx's "holds the result table back..." coverage: the
  // chip must still appear from `toolCalls` alone at that point, since `message.table` is not yet
  // set on the message).
  const metaRowToolCalls = message.table ? [] : toolCalls;
  const tableProvenanceChips: ResultTableProvenanceChip[] | undefined = message.table
    ? toolCalls.map(toolCall => {
        const { short, full } = describeToolCall(toolCall, message.table);
        return {
          id: toolCall.id,
          shortLabel: short,
          fullLabel: full,
          toolName: toolCall.name,
          argumentsJson: toolCall.arguments,
        };
      })
    : undefined;
  // Only the finished-assistant branch below renders through EuiMarkdownFormat (the user bubble
  // and the streaming branch both render message.content as plain text/JSX, which React already
  // escapes), so this is only ever read there — memoized on message.content since re-sanitizing
  // an unchanged, already-finished answer on every unrelated re-render is pure waste.
  const sanitizedContent = useMemo(
    () => sanitizeAssistantMarkdown(message.content),
    [message.content],
  );
  // One open/closed state PER chip, keyed by what that chip reveals. A single shared panel was
  // tried first and was wrong twice over: clicking one query opened every query on the turn, and
  // because the panel rendered above the chips it pushed them down, so the control that closed it
  // was no longer where the reader had just clicked. A chip now opens exactly the thing it names,
  // directly beneath itself, and the same click closes it.
  const [openRawIds, setOpenRawIds] = useState<Set<string>>(new Set());
  const rawViewId = `wzAiQueryRaw-${message.id}`;
  const toggleRawId = (id: string) =>
    setOpenRawIds(previous => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  // No chip for the table's executed DSL: `buildDiscoverUrl` (common/discover-url.ts) already
  // embeds that exact query in the "Open in Discover" link as a filter named "AI Assistant query",
  // so the table's own link shows the reader the literal query that ran — in a surface built for
  // reading queries. A second copy in the meta row was the same query at a lower abstraction
  // level, competing with the chips that answer the question people actually ask of an answer:
  // what did it look for?
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
  // widens up to the table's own breakout width (see the wrapper below), and without this the
  // answer's sentences inherited that width and ran to ~117 characters a line — roughly 60% past
  // the point where the eye reliably finds the next line, which reads as a wall of text. Only
  // block content (the table, the raw query view) is allowed to use the extra width.
  // '68ch', not a pixel figure: mirrors `$wzProseMeasure` in _redesign.scss (layout contract §5,
  // "one measure, one gutter") — this component has no colocated .scss file of its own to import
  // the token from directly, so the literal value is restated here with this comment as the
  // pointer back to the source of truth; ch scales with the font's own average character width,
  // unlike a fixed px figure.
  const PROSE_MEASURE = '68ch';
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
            {/* sanitizeAssistantMarkdown (#8890): the finished answer is model output built
                  from tool results that can carry attacker-influenced text — see that
                  function's doc comment for why this runs here instead of an EUI
                  processingPluginList override. */}
            <EuiMarkdownFormat>{sanitizedContent}</EuiMarkdownFormat>
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
            provenanceChips={tableProvenanceChips}
            transcriptHeightPx={transcriptHeightPx}
          />
        </>
      )}
      {/* Graceful-failure handoff (server/tools/suggest-discover-query.ts): the model's own reason
          text plus a link to run the query itself in Discover, in place of the table/answer it
          could not produce. `discover` is a synthetic, minimal TableSpec — {columns:[], rows:[]}
          carry nothing ResultTable itself would render; only `discover` is real, reusing the exact
          same DiscoverLink/resolveDiscoverUrl plumbing every result table's "Open in Discover"
          link already goes through (discover-link.tsx). */}
      {message.suggestedQuery && (
        <>
          <EuiSpacer size='s' />
          <EuiCallOut
            size='s'
            iconType='iInCircle'
            title={message.suggestedQuery.reason}
          >
            <DiscoverLink
              spec={{
                columns: [],
                rows: [],
                discover: {
                  index: message.suggestedQuery.index,
                  dsl: message.suggestedQuery.dsl,
                },
              }}
              resolveDiscoverUrl={resolveDiscoverUrl}
            />
          </EuiCallOut>
        </>
      )}
    </>
  );

  const bubble = (
    <EuiFlexItem
      grow={false}
      style={{
        // The user turn keeps its 75% share (a question is always prose); the assistant turn
        // gets the 68ch prose measure EXCEPT when it carries a result table, which may break out
        // up to `$wzTableMaxWidth` (1300px, layout contract §5) instead — a wide table squeezed
        // into 75% of an already-narrow column forced a horizontal scrollbar inside the table's
        // own scroller.
        maxWidth: isUser ? '75%' : message.table ? 'min(100%, 1300px)' : '68ch',
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
          metaRowToolCalls.map(toolCall => {
            const { short, full } = describeToolCall(toolCall, message.table);
            const isRawOpen = openRawIds.has(toolCall.id);
            return (
              <EuiFlexItem grow={false} key={toolCall.id}>
                <EuiBadge
                  color={isRawOpen ? 'default' : 'hollow'}
                  iconType='search'
                  title={full}
                  onClick={() => toggleRawId(toolCall.id)}
                  onClickAriaLabel={i18n.translate(
                    'wazuhAiAssistant.chat.queryChipAriaLabel',
                    {
                      defaultMessage: 'Show the executed query: {label}',
                      values: { label: full },
                    },
                  )}
                  aria-expanded={isRawOpen}
                  aria-controls={`${rawViewId}-${toolCall.id}`}
                >
                  {short}
                </EuiBadge>
              </EuiFlexItem>
            );
          })}
      </EuiFlexGroup>
      {/* Each open chip's content, BELOW the chip row: the chip stays exactly where it was
            clicked, so the same click closes what it opened. The answer is only as trustworthy as
            the query behind it, and an analyst has to be able to check that query without reading
            server logs — but nothing here is on screen unbidden. */}
      {!isUser &&
        metaRowToolCalls
          .filter(toolCall => openRawIds.has(toolCall.id))
          .map(toolCall => (
            <div
              key={toolCall.id}
              id={`${rawViewId}-${toolCall.id}`}
              style={proseStyle}
            >
              <EuiSpacer size='xs' />
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
            </div>
          ))}
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
