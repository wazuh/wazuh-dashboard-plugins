import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatInput, ChatInputHandle } from './chat-input';

function noop() {}

describe('ChatInput', () => {
  it('renders the textarea with the given value and placeholder/aria-label', () => {
    render(
      <ChatInput
        value='hello'
        onChange={noop}
        disabled={false}
        isGenerating={false}
        onSend={noop}
      />,
    );

    const textarea = screen.getByRole('textbox', {
      name: 'Chat message',
    }) as HTMLTextAreaElement;
    expect(textarea.value).toBe('hello');
    expect(textarea).toHaveAttribute(
      'placeholder',
      'Ask the AI Assistant about your security findings...',
    );
  });

  it('calls onChange with the new text as the user types', () => {
    const onChange = jest.fn();
    render(
      <ChatInput
        value=''
        onChange={onChange}
        disabled={false}
        isGenerating={false}
        onSend={noop}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Chat message' }), {
      target: { value: 'abc' },
    });
    expect(onChange).toHaveBeenCalledWith('abc');
  });

  it('sends the trimmed value and clears the input on Enter (no Shift)', () => {
    const onSend = jest.fn();
    const onChange = jest.fn();
    render(
      <ChatInput
        value='  hello world  '
        onChange={onChange}
        disabled={false}
        isGenerating={false}
        onSend={onSend}
      />,
    );

    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Chat message' }), {
      key: 'Enter',
    });

    expect(onSend).toHaveBeenCalledWith('hello world');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('does not send on Shift+Enter (allows a newline instead)', () => {
    const onSend = jest.fn();
    render(
      <ChatInput
        value='draft'
        onChange={noop}
        disabled={false}
        isGenerating={false}
        onSend={onSend}
      />,
    );

    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Chat message' }), {
      key: 'Enter',
      shiftKey: true,
    });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends nothing on Enter when the value is only whitespace', () => {
    const onSend = jest.fn();
    const onChange = jest.fn();
    render(
      <ChatInput
        value='   '
        onChange={onChange}
        disabled={false}
        isGenerating={false}
        onSend={onSend}
      />,
    );

    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Chat message' }), {
      key: 'Enter',
    });

    expect(onSend).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not send via Enter while isGenerating', () => {
    const onSend = jest.fn();
    render(
      <ChatInput
        value='hi'
        onChange={noop}
        disabled={false}
        isGenerating
        onSend={onSend}
      />,
    );

    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Chat message' }), {
      key: 'Enter',
    });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('disables the textarea when disabled is true', () => {
    render(
      <ChatInput
        value='hi'
        onChange={noop}
        disabled
        isGenerating={false}
        onSend={noop}
      />,
    );

    expect(
      screen.getByRole('textbox', { name: 'Chat message' }),
    ).toBeDisabled();
  });

  it('disables the textarea while isGenerating', () => {
    render(
      <ChatInput
        value='hi'
        onChange={noop}
        disabled={false}
        isGenerating
        onSend={noop}
      />,
    );

    expect(
      screen.getByRole('textbox', { name: 'Chat message' }),
    ).toBeDisabled();
  });

  it('exposes an imperative send() handle that trims and forwards the value', () => {
    const onSend = jest.fn();
    const onChange = jest.fn();
    const ref = React.createRef<ChatInputHandle>();
    render(
      <ChatInput
        ref={ref}
        value=' hi '
        onChange={onChange}
        disabled={false}
        isGenerating={false}
        onSend={onSend}
      />,
    );

    ref.current?.send();

    expect(onSend).toHaveBeenCalledWith('hi');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('autofocuses the textarea once it transitions from disabled to enabled', () => {
    const { rerender } = render(
      <ChatInput
        value=''
        onChange={noop}
        disabled
        isGenerating={false}
        onSend={noop}
      />,
    );
    expect(document.activeElement).not.toBe(
      screen.getByRole('textbox', { name: 'Chat message' }),
    );

    rerender(
      <ChatInput
        value=''
        onChange={noop}
        disabled={false}
        isGenerating={false}
        onSend={noop}
      />,
    );

    expect(document.activeElement).toBe(
      screen.getByRole('textbox', { name: 'Chat message' }),
    );
  });

  it('exposes an imperative focus() handle that focuses the underlying textarea', () => {
    const ref = React.createRef<ChatInputHandle>();
    render(
      <ChatInput
        ref={ref}
        value=''
        onChange={noop}
        disabled={false}
        isGenerating={false}
        onSend={noop}
      />,
    );

    const textarea = screen.getByRole('textbox', { name: 'Chat message' });
    textarea.blur();
    expect(document.activeElement).not.toBe(textarea);

    ref.current?.focus();
    expect(document.activeElement).toBe(textarea);
  });
});
