import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { EuiTextArea } from '@elastic/eui';
import { i18n } from '@osd/i18n';

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

    // Auto-expand: reset to auto so shrinking works, then grow to fit content.
    useEffect(() => {
      const el = textAreaRef.current;
      if (!el) {
        return;
      }
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }, [value]);

    return (
      <EuiTextArea
        inputRef={node => {
          textAreaRef.current = node;
        }}
        fullWidth
        rows={2}
        // isGenerating is folded in here (not just at the parent's `disabled` prop) so typing
        // or pressing Enter mid-stream can't be silently swallowed by sendRef's own
        // isGenerating early-return below.
        disabled={disabled || isGenerating}
        value={value}
        style={{
          border: 'none',
          boxShadow: 'none',
          resize: 'none',
          overflow: 'hidden',
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
