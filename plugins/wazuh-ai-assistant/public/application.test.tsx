import React from 'react';
import { act, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  AppLeaveHandler,
  AppMountParameters,
  CoreStart,
} from '../../../src/core/public';
import { renderApp } from './application';

/**
 * Covers the app shell's ONE structural guarantee: the Chat tab is hidden, never unmounted, when the
 * user visits Settings. Swapping the two components destroyed ChatPage's whole state — transcript,
 * active conversation id, pseudonym map, tool history — so a five-second detour into Settings lost
 * the conversation and made the next turn create a second saved one.
 *
 * The two pages are replaced with stubs that count their own mounts, since what matters here is
 * mount lifecycle and visibility, not what either page renders.
 */

const mockMountCounts = { chat: 0, settings: 0 };
/** `mock`-prefixed alias so the hoisted `jest.mock` factories below may reference React at all. */
const mockReact = React;

function mockMountCountingStub(page: 'chat' | 'settings') {
  return (props: { onGeneratingChange?: (generating: boolean) => void }) => {
    mockReact.useEffect(() => {
      mockMountCounts[page] += 1;
    }, []);
    // The Chat stub exposes a button that flips the shell's "a turn is generating" flag, which is
    // what the leave handler reads.
    return mockReact.createElement(
      'div',
      { 'data-test-subj': `${page}-marker` },
      `${page} page`,
      props.onGeneratingChange
        ? mockReact.createElement(
            'button',
            {
              type: 'button',
              onClick: () => props.onGeneratingChange?.(true),
            },
            'start generating',
          )
        : null,
    );
  };
}

jest.mock('./components/chat/chat-page', () => ({
  ChatPage: mockMountCountingStub('chat'),
}));

jest.mock('./components/settings/settings-page', () => ({
  SettingsPage: mockMountCountingStub('settings'),
}));

const mockProviderList = jest.fn();

jest.mock('./services/settings-service', () => ({
  SettingsService: jest.fn().mockImplementation(() => ({
    list: () => mockProviderList(),
  })),
}));

function coreMock(): CoreStart {
  return {
    http: { basePath: { prepend: (path: string) => path } },
    uiSettings: { get: () => false },
    chrome: { setBreadcrumbs: jest.fn() },
  } as unknown as CoreStart;
}

/** The leave handler the shell registered through `onAppLeave`, or undefined if it registered none. */
let registeredLeaveHandler: AppLeaveHandler | undefined;

/** Mounts the app the way core does, and returns core's unmount callback. */
function mountApp(): () => void {
  const element = document.createElement('div');
  document.body.append(element);
  registeredLeaveHandler = undefined;
  let unmount: () => void = () => undefined;
  act(() => {
    unmount = renderApp(coreMock(), {
      element,
      onAppLeave: (handler: AppLeaveHandler) => {
        registeredLeaveHandler = handler;
      },
    } as AppMountParameters);
  });
  return unmount;
}

/** Stand-in for the platform's action factory, so a test can see which action the handler picked. */
const leaveActions = {
  default: () => ({ type: 'default' }),
  confirm: (text: string, title?: string) => ({ type: 'confirm', text, title }),
};

/** The rendered stub element for a page, or null when that page is not mounted at all. */
function marker(page: 'chat' | 'settings'): HTMLElement | null {
  return document.querySelector(`[data-test-subj="${page}-marker"]`);
}

/** True when the element sits inside a subtree the shell has hidden with `display: none`. */
function isHidden(element: HTMLElement): boolean {
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    if (node.style.display === 'none') {
      return true;
    }
  }
  return false;
}

describe('AI Assistant app shell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMountCounts.chat = 0;
    mockMountCounts.settings = 0;
    document.body.innerHTML = '';
    mockProviderList.mockResolvedValue([]);
  });

  it('mounts the Chat tab and does not mount Settings until it is opened', async () => {
    mountApp();
    await waitFor(() => expect(marker('chat')).not.toBeNull());

    expect(mockMountCounts.chat).toBe(1);
    expect(marker('settings')).toBeNull();
    expect(mockMountCounts.settings).toBe(0);
  });

  it('keeps the Chat tab mounted, only hidden, while Settings is open', async () => {
    mountApp();
    await waitFor(() => expect(marker('chat')).not.toBeNull());

    fireEvent.click(screen.getByText('Settings'));
    await waitFor(() => expect(marker('settings')).not.toBeNull());

    expect(mockMountCounts.chat).toBe(1);
    expect(isHidden(marker('chat') as HTMLElement)).toBe(true);
    expect(isHidden(marker('settings') as HTMLElement)).toBe(false);
  });

  it('remounts neither page when switching tabs back and forth', async () => {
    mountApp();
    await waitFor(() => expect(marker('chat')).not.toBeNull());

    fireEvent.click(screen.getByText('Settings'));
    await waitFor(() => expect(marker('settings')).not.toBeNull());
    fireEvent.click(screen.getByText('Chat'));
    await waitFor(() =>
      expect(isHidden(marker('chat') as HTMLElement)).toBe(false),
    );
    fireEvent.click(screen.getByText('Settings'));
    await waitFor(() =>
      expect(isHidden(marker('chat') as HTMLElement)).toBe(true),
    );

    expect(mockMountCounts.chat).toBe(1);
    expect(mockMountCounts.settings).toBe(1);
  });

  it('leaves without asking when no turn is generating', async () => {
    mountApp();
    await waitFor(() => expect(marker('chat')).not.toBeNull());

    expect(registeredLeaveHandler).toBeDefined();
    expect(registeredLeaveHandler?.(leaveActions as never)).toEqual({
      type: 'default',
    });
  });

  it('asks for confirmation before leaving while a turn is generating', async () => {
    mountApp();
    await waitFor(() => expect(marker('chat')).not.toBeNull());

    fireEvent.click(screen.getByText('start generating'));

    // Same handler instance, registered once — it must read the CURRENT state, not the state at
    // registration time.
    const action = registeredLeaveHandler?.(leaveActions as never) as {
      type: string;
      title?: string;
    };
    expect(action.type).toBe('confirm');
    expect(action.title).toBe('A response is still generating');
  });

  it('unmounts everything when core unmounts the app', async () => {
    const unmount = mountApp();
    await waitFor(() => expect(marker('chat')).not.toBeNull());

    act(() => {
      unmount();
    });

    expect(marker('chat')).toBeNull();
  });
});
