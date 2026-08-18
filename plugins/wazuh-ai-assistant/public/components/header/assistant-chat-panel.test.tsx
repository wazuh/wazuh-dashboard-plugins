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
    railDisplayModeOverride?: 'expanded' | 'collapsed';
    allowRailFlyout?: boolean;
  }) =>
    mockReact.createElement(
      'div',
      {
        'data-test-subj': 'chat-page-stub',
        'data-sidebar': String(props.showConversationSidebar),
        'data-rail-mode': String(props.railDisplayModeOverride),
        'data-allow-rail-flyout': String(props.allowRailFlyout),
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

  it('never lets the rail escalate to a full-screen flyout inside this docked panel', () => {
    // This panel's own width (SIDEBAR_MIN_PANEL_WIDTH = 600) routinely sits inside ChatPage's
    // flyout band (600-900px) — an EuiFlyout there would cover the whole dashboard from within a
    // sidecar the user never asked to leave. `allowRailFlyout={false}` is what caps it at the
    // collapsed strip instead; see ChatPage's own `allowRailFlyout` prop doc comment.
    renderPanel();

    expect(chatPageStub()).toHaveAttribute('data-allow-rail-flyout', 'false');
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

  it('routes the maximize shortcut to the app chat view and closes the panel', () => {
    const { props } = renderPanel();

    fireEvent.click(
      document.querySelector(
        '[data-test-subj="wzAiAssistantPanelMaximizeButton"]',
      ) as HTMLElement,
    );

    expect(props.runGuarded).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalled();
    expect(mockNavigateToApp).toHaveBeenCalledWith('wazuhAiAssistant', {
      path: '#/',
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

  it('always renders the rail — narrower than the auto-expand threshold defaults to collapsed', () => {
    // jsdom reports offsetWidth 0, i.e. narrower than the auto-expand threshold. The rail must
    // still be RENDERED (never hidden outright) so "New conversation" and "Search" stay reachable
    // without an extra click — only its mode (collapsed here) is width-driven.
    renderPanel();

    expect(chatPageStub()).toHaveAttribute('data-sidebar', 'true');
    expect(chatPageStub()).toHaveAttribute('data-rail-mode', 'collapsed');
  });

  it('auto-prefers the expanded rail once the panel is wide enough', () => {
    const widthSpy = jest
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(800);

    renderPanel();

    expect(chatPageStub()).toHaveAttribute('data-sidebar', 'true');
    expect(chatPageStub()).toHaveAttribute('data-rail-mode', 'expanded');
    widthSpy.mockRestore();
  });

  it('expands the rail from a narrow panel via the toolbar toggle', () => {
    // jsdom reports offsetWidth 0, i.e. narrower than the auto-expand threshold.
    renderPanel();
    expect(chatPageStub()).toHaveAttribute('data-rail-mode', 'collapsed');

    fireEvent.click(screen.getByLabelText('Expand saved conversations'));

    expect(chatPageStub()).toHaveAttribute('data-sidebar', 'true');
    expect(chatPageStub()).toHaveAttribute('data-rail-mode', 'expanded');
  });

  it('keeps a manually-expanded rail expanded across a resize that would otherwise auto-collapse it', () => {
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
      .mockReturnValue(500);

    renderPanel();
    expect(chatPageStub()).toHaveAttribute('data-rail-mode', 'collapsed');

    fireEvent.click(screen.getByLabelText('Expand saved conversations'));
    expect(chatPageStub()).toHaveAttribute('data-rail-mode', 'expanded');

    // A later resize (still narrow) must not silently re-collapse it once the user has expanded it.
    triggerResize?.();
    expect(chatPageStub()).toHaveAttribute('data-rail-mode', 'expanded');
    expect(chatPageStub()).toHaveAttribute('data-sidebar', 'true');

    widthSpy.mockRestore();
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver =
      originalResizeObserver;
  });
});
