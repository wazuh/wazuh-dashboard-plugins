import React, { useEffect, useImperativeHandle, useRef } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTextArea,
  EuiButton,
  EuiButtonEmpty,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';

interface ChatInputProps {
  value: string;
  onChange: (text: string) => void;
  disabled: boolean;
  isGenerating: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

export interface ChatInputHandle {
  focus: () => void;
}

/**
 * Controlled input: the parent (ChatPage) owns the text value so example-question chips in the
 * welcome state can prefill it without this component needing an imperative handle.
 */
export const ChatInput = React.forwardRef<ChatInputHandle, ChatInputProps>(
  ({ value, onChange, disabled, isGenerating, onSend, onStop }, ref) => {
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => textAreaRef.current?.focus(),
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

    const handleSend = () => {
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

    return (
      <EuiFlexGroup gutterSize='s' alignItems='flexEnd'>
        <EuiFlexItem>
          <EuiTextArea
            inputRef={node => {
              textAreaRef.current = node;
            }}
            fullWidth
            resize='vertical'
            rows={2}
            // isGenerating is folded in here (not just at the parent's `disabled` prop) so typing
            // or pressing Enter mid-stream can't be silently swallowed by handleSend's own
            // isGenerating early-return below.
            disabled={disabled || isGenerating}
            value={value}
            placeholder={i18n.translate(
              'wazuhAiAssistant.chat.inputPlaceholder',
              {
                defaultMessage:
                  'Ask the AI Assistant about your security findings...',
              },
            )}
            aria-label={i18n.translate('wazuhAiAssistant.chat.inputAriaLabel', {
              defaultMessage: 'Chat message',
            })}
            onChange={event => onChange(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          {isGenerating ? (
            <EuiButtonEmpty onClick={onStop} color='danger' iconType='cross'>
              {i18n.translate('wazuhAiAssistant.chat.stopButton', {
                defaultMessage: 'Stop',
              })}
            </EuiButtonEmpty>
          ) : (
            <EuiButton
              onClick={handleSend}
              disabled={disabled || !value.trim()}
              fill
              iconType='kqlFunction'
            >
              {i18n.translate('wazuhAiAssistant.chat.sendButton', {
                defaultMessage: 'Send',
              })}
            </EuiButton>
          )}
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  },
);

ChatInput.displayName = 'ChatInput';
