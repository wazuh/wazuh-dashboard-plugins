import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CoreStart } from '../../../../../src/core/public';
import { AssistantChatPanel } from './assistant-chat-panel';

const mockReact = React;

jest.mock('../chat/chat-page', () => ({
  ChatPage: (props: {
    onGeneratingChange?: (generating: boolean) => void;
    onNavigateToSettings: () => void;
    showConversationSidebar?: boolean;
  }) =>
    mockReact.createElement(
      'div',
      {
        'data-test-subj': 'chat-page-stub',
        'data-sidebar': String(props.showConversationSidebar),
      },
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

const mockNavigateToApp = jest.fn();

function coreMock(): CoreStart {
  return {
    http: {},
    application: { navigateToApp: mockNavigateToApp },
  } as unknown as CoreStart;
}

/** Pass-through gate: the real interrupt-confirm behavior is the header button's and is
 * covered by assistant-header-button.test.tsx; here we only assert the panel routes
 * every close/settings action through it. */
function passThroughGuard() {
  return jest.fn((action: () => void) => action());
}

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof AssistantChatPanel>> = {},
) {
  const props: React.ComponentProps<typeof AssistantChatPanel> = {
    core: coreMock(),
    onClose: jest.fn(),
    runGuarded: passThroughGuard(),
    isGeneratingRef: { current: false },
    ...overrides,
  };
  const view = render(<AssistantChatPanel {...props} />);
  return { ...view, props };
}

function chatPageStub(): HTMLElement {
  const element = document.querySelector('[data-test-subj="chat-page-stub"]');
  if (!(element instanceof HTMLElement)) {
    throw new Error('chat page stub not rendered');
  }
  return element;
}

describe('AssistantChatPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chat page inside the panel', () => {
    renderPanel();

    expect(
      document.querySelector('[data-test-subj="wzAiAssistantPanel"]'),
    ).toBeInTheDocument();
    expect(chatPageStub()).toBeInTheDocument();
  });

  it('routes the close button through the interrupt gate', () => {
    const { props } = renderPanel();

    fireEvent.click(screen.getByLabelText('Close the AI Assistant'));

    expect(props.runGuarded).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('routes the settings shortcut to the app settings view and closes the panel', () => {
    const { props } = renderPanel();

    fireEvent.click(
      document.querySelector(
        '[data-test-subj="wzAiAssistantPanelSettingsButton"]',
      ) as HTMLElement,
    );

    expect(props.runGuarded).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalled();
    expect(mockNavigateToApp).toHaveBeenCalledWith('wazuhAiAssistant', {
      path: '#/settings',
    });
  });

  it("routes ChatPage's add-provider CTA to settings with the add-provider flag", () => {
    const { props } = renderPanel();

    fireEvent.click(screen.getByText('chat settings CTA'));

    expect(props.onClose).toHaveBeenCalled();
    expect(mockNavigateToApp).toHaveBeenCalledWith('wazuhAiAssistant', {
      path: '#/settings?addProvider=true',
    });
  });

  it('reports generating turns into the shared ref and arms the native unload prompt', () => {
    const isGeneratingRef = { current: false };
    const { unmount } = renderPanel({ isGeneratingRef });
    const fireUnload = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event;
    };

    expect(fireUnload().defaultPrevented).toBe(false);

    fireEvent.click(screen.getByText('start generating'));
    expect(isGeneratingRef.current).toBe(true);
    expect(fireUnload().defaultPrevented).toBe(true);

    unmount();
    expect(fireUnload().defaultPrevented).toBe(false);
  });

  it('hides the conversations sidebar while the panel is narrow', () => {
    // jsdom reports offsetWidth 0, i.e. narrower than the sidebar threshold.
    renderPanel();

    expect(chatPageStub()).toHaveAttribute('data-sidebar', 'false');
  });

  it('shows the conversations sidebar once the panel is wide enough', () => {
    const widthSpy = jest
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(800);

    renderPanel();

    expect(chatPageStub()).toHaveAttribute('data-sidebar', 'true');
    widthSpy.mockRestore();
  });

  it('makes the conversations list reachable from a narrow panel via the toolbar toggle', () => {
    // jsdom reports offsetWidth 0, i.e. narrower than the auto-show threshold.
    renderPanel();
    expect(chatPageStub()).toHaveAttribute('data-sidebar', 'false');

    fireEvent.click(screen.getByLabelText('Show saved conversations'));

    expect(chatPageStub()).toHaveAttribute('data-sidebar', 'true');
  });

  it('keeps a manually-closed sidebar closed across a resize that would otherwise auto-show it', () => {
    // jsdom has no ResizeObserver; stub one whose callback this test can re-trigger on demand
    // to simulate a later resize (distinct from the mount-time `update()` call, which runs
    // regardless of ResizeObserver's existence).
    let triggerResize: (() => void) | undefined;
    class ResizeObserverStub {
      constructor(callback: () => void) {
        triggerResize = callback;
      }
      observe() {}
      disconnect() {}
    }
    const originalResizeObserver = (
      window as unknown as { ResizeObserver?: unknown }
    ).ResizeObserver;
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver =
      ResizeObserverStub;
    const widthSpy = jest
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(800);

    renderPanel();
    expect(chatPageStub()).toHaveAttribute('data-sidebar', 'true');

    fireEvent.click(screen.getByLabelText('Hide saved conversations'));
    expect(chatPageStub()).toHaveAttribute('data-sidebar', 'false');

    // A later resize (still wide) must not silently reopen it once the user has closed it.
    triggerResize?.();
    expect(chatPageStub()).toHaveAttribute('data-sidebar', 'false');

    widthSpy.mockRestore();
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver =
      originalResizeObserver;
  });
});
