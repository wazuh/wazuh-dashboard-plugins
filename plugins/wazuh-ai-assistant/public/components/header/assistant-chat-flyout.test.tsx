import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CoreStart } from '../../../../../src/core/public';
import { AssistantChatFlyout } from './assistant-chat-flyout';

const mockReact = React;

jest.mock('../chat/chat-page', () => ({
  ChatPage: (props: {
    onGeneratingChange?: (generating: boolean) => void;
    onNavigateToSettings: () => void;
  }) =>
    mockReact.createElement(
      'div',
      { 'data-test-subj': 'chat-page-stub' },
      mockReact.createElement(
        'button',
        {
          type: 'button',
          onClick: () => props.onGeneratingChange?.(true),
        },
        'start generating',
      ),
      mockReact.createElement(
        'button',
        { type: 'button', onClick: () => props.onNavigateToSettings() },
        'chat settings CTA',
      ),
    ),
}));

jest.mock('../../services/settings-service', () => ({
  SettingsService: jest.fn().mockImplementation(() => ({
    list: () => Promise.resolve([]),
  })),
}));

const mockOpenConfirm = jest.fn();
const mockNavigateToApp = jest.fn();

function coreMock(): CoreStart {
  return {
    http: {},
    overlays: { openConfirm: mockOpenConfirm },
    application: { navigateToApp: mockNavigateToApp },
  } as unknown as CoreStart;
}

function closeButton(): HTMLElement {
  const element = document.querySelector(
    '[data-test-subj="euiFlyoutCloseButton"]',
  );
  if (!(element instanceof HTMLElement)) {
    throw new Error('flyout close button not rendered');
  }
  return element;
}

describe('AssistantChatFlyout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chat page inside the flyout', () => {
    render(<AssistantChatFlyout core={coreMock()} onClose={jest.fn()} />);

    expect(
      document.querySelector('[data-test-subj="wzAiAssistantFlyout"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-test-subj="chat-page-stub"]'),
    ).toBeInTheDocument();
  });

  it('closes without asking while no answer is generating', () => {
    const onClose = jest.fn();
    render(<AssistantChatFlyout core={coreMock()} onClose={onClose} />);

    fireEvent.click(closeButton());

    expect(onClose).toHaveBeenCalled();
    expect(mockOpenConfirm).not.toHaveBeenCalled();
  });

  it('asks for confirmation before closing while generating, and stays open on cancel', async () => {
    mockOpenConfirm.mockResolvedValue(false);
    const onClose = jest.fn();
    render(<AssistantChatFlyout core={coreMock()} onClose={onClose} />);

    fireEvent.click(screen.getByText('start generating'));
    fireEvent.click(closeButton());

    await waitFor(() => expect(mockOpenConfirm).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes after the user confirms interrupting the running answer', async () => {
    mockOpenConfirm.mockResolvedValue(true);
    const onClose = jest.fn();
    render(<AssistantChatFlyout core={coreMock()} onClose={onClose} />);

    fireEvent.click(screen.getByText('start generating'));
    fireEvent.click(closeButton());

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('routes the settings shortcut to the app settings view and closes the flyout', () => {
    const onClose = jest.fn();
    render(<AssistantChatFlyout core={coreMock()} onClose={onClose} />);

    fireEvent.click(
      document.querySelector(
        '[data-test-subj="wzAiAssistantFlyoutSettingsButton"]',
      ) as HTMLElement,
    );

    expect(onClose).toHaveBeenCalled();
    expect(mockNavigateToApp).toHaveBeenCalledWith('wazuhAiAssistant', {
      path: '#/settings',
    });
  });

  it('arms the native unload prompt only while an answer is generating', () => {
    const { unmount } = render(
      <AssistantChatFlyout core={coreMock()} onClose={jest.fn()} />,
    );
    const fireUnload = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event;
    };

    expect(fireUnload().defaultPrevented).toBe(false);

    fireEvent.click(screen.getByText('start generating'));
    expect(fireUnload().defaultPrevented).toBe(true);

    unmount();
    expect(fireUnload().defaultPrevented).toBe(false);
  });

  it("routes ChatPage's own settings CTA the same way", () => {
    const onClose = jest.fn();
    render(<AssistantChatFlyout core={coreMock()} onClose={onClose} />);

    fireEvent.click(screen.getByText('chat settings CTA'));

    expect(onClose).toHaveBeenCalled();
    expect(mockNavigateToApp).toHaveBeenCalledWith('wazuhAiAssistant', {
      path: '#/settings',
    });
  });
});
