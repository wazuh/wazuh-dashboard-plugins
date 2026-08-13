import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { EuiTextArea } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { WZ_COMPOSER_MAX_ROWS } from './layout-constants';

interface ChatInputProps {
  value: string;
  onChange: (text: string) => void;
  disabled: boolean;
  isGenerating: boolean;
  onSend: (text: string) => void;
}

export interface ChatInputHandle {
  focus: () => void;
  send: () => void;
}

/**
 * Composer floor and ceiling (redesign-v2-spec.md layout contract §2): the field autogrows past its
 * one-line floor (`rows={1}` below) up to `WZ_COMPOSER_MAX_ROWS`, then scrolls internally instead of growing
 * further. Kept as a plain numeric constant rather than read from `$wzComposerMaxRows`
 * (public/components/_redesign.scss) — there is no SCSS-to-TS bridge in this build, so the two have
 * to be kept equal by hand. This is a SEPARATE, smaller ceiling than `.wzComposerRow`'s own
 * `max-height: $wzComposerMaxHeight` (chat-page.scss), which caps the WHOLE composer (field +
 * controls + disclaimer), not just the field.
 */
/** Fallback line height (px) for the rare case `getComputedStyle` reports something
 * `parseFloat` can't read (e.g. a unitless/`normal` line-height, which is what jsdom's computed
 * style always returns) — without it a NaN would collapse the autogrow cap to 0. */
const FALLBACK_LINE_HEIGHT = 20;

/**
 * Controlled input: the parent (ChatPage) owns the text value so example-question chips in the
 * welcome state can prefill it without this component needing an imperative handle.
 */
export const ChatInput = React.forwardRef<ChatInputHandle, ChatInputProps>(
  ({ value, onChange, disabled, isGenerating, onSend }, ref) => {
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    // Keep a ref so the imperative handle's `send` always sees the latest value/callbacks
    // without being recreated on every render.
    const sendRef = useRef<() => void>(() => {});

    sendRef.current = () => {
      if (isGenerating) {
        return;
      }
      const trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      onSend(trimmed);
      onChange('');
    };

    useImperativeHandle(
      ref,
      () => ({
        focus: () => textAreaRef.current?.focus(),
        send: () => sendRef.current(),
      }),
      [],
    );

    // autoFocus only fires on mount; also focus when the input becomes enabled after providers
    // finish loading (e.g. the Chat tab is opened before the provider list has resolved).
    useEffect(() => {
      if (!disabled) {
        textAreaRef.current?.focus();
      }
    }, [disabled]);

    // Autogrow, capped at WZ_COMPOSER_MAX_ROWS then scrolling internally (contract §2: "autogrow to 5 rows then
    // internal scroll"). `lineHeight`/padding are read from the field's OWN computed style rather
    // than assumed, so the cap tracks whatever EUI's own type scale renders at instead of a guessed
    // pixel figure that could drift from it.
    useEffect(() => {
      const el = textAreaRef.current;
      if (!el) {
        return;
      }
      const resize = () => {
        const computed = window.getComputedStyle(el);
        const lineHeight =
          parseFloat(computed.lineHeight) || FALLBACK_LINE_HEIGHT;
        const paddingTop = parseFloat(computed.paddingTop) || 0;
        const paddingBottom = parseFloat(computed.paddingBottom) || 0;
        const maxHeight =
          lineHeight * WZ_COMPOSER_MAX_ROWS + paddingTop + paddingBottom;

        el.style.height = 'auto';
        // A hidden field measures zero. ChatPage stays MOUNTED behind `display: none` while the
        // Settings tab is visible (application.tsx), so landing on `#/settings` and switching to
        // Chat would otherwise write `height: 0px` here and leave it there — the field renders as a
        // padding-only sliver with the placeholder clipped, until the first keystroke changes
        // `value` and re-runs this. Restoring the floor and bailing keeps `rows={1}` in charge until
        // the field is really laid out. (jsdom reports 0 for every element, so this is also the
        // branch every unit test takes.)
        if (el.scrollHeight === 0) {
          el.style.height = '';
          return;
        }
        const nextHeight = Math.min(el.scrollHeight, maxHeight);
        el.style.height = `${nextHeight}px`;
        // Past the cap the field scrolls internally rather than growing further; below it there is
        // nothing to scroll, so overflow stays hidden (no phantom scrollbar on a two-line field).
        el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
      };

      resize();
      // Wrapped-line count depends on WIDTH, which changes without `value` changing: the rail
      // collapses at 1100px, the window resizes, the user zooms. Without this the inline height and
      // the overflow flag both go stale, and a message that has grown to five lines gets clipped
      // under `overflow: hidden`. Guarded because jsdom has no ResizeObserver.
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(() => resize());
      observer.observe(el);
      return () => observer.disconnect();
    }, [value]);

    return (
      <EuiTextArea
        inputRef={node => {
          textAreaRef.current = node;
        }}
        fullWidth
        // One full line box is the floor (contract §2) — autogrow only ever adds height from here.
        rows={1}
        // Height transition (reduced-motion-guarded, chat-page.scss) lives on this class; the
        // overflow toggle above still applies inline since it depends on this field's own measured
        // content, not something a stylesheet can express.
        className='wzComposerTextarea'
        disabled={disabled || isGenerating}
        value={value}
        style={{
          border: 'none',
          boxShadow: 'none',
          resize: 'none',
          backgroundColor: 'inherit',
        }}
        placeholder={i18n.translate('wazuhAiAssistant.chat.inputPlaceholder', {
          defaultMessage:
            'Ask the AI Assistant about your security findings...',
        })}
        aria-label={i18n.translate('wazuhAiAssistant.chat.inputAriaLabel', {
          defaultMessage: 'Chat message',
        })}
        onChange={event => onChange(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendRef.current();
          }
        }}
      />
    );
  },
);

ChatInput.displayName = 'ChatInput';
