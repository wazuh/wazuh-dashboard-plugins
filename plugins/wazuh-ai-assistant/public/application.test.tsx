import React from 'react';
import { act, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  AppLeaveHandler,
  AppMountParameters,
  CoreStart,
} from '../../../src/core/public';
import { renderApp, routeFromPathname } from './application';

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
  return (props: {
    onGeneratingChange?: (generating: boolean) => void;
    onNavigateToSettings?: () => void;
    autoOpenCreateForm?: boolean;
    onCreateFormOpenChange?: (open: boolean) => void;
  }) => {
    mockReact.useEffect(() => {
      mockMountCounts[page] += 1;
    }, []);
    // The Chat stub exposes a button that flips the shell's "a turn is generating" flag (what the
    // leave handler reads) and one for its add-provider CTA; the Settings stub mirrors the
    // add-provider auto-open flag and exposes buttons standing in for BOTH ways the real
    // create-provider flyout reports its own open state: the URL-driven auto-open (already
    // reflected via `autoOpenCreateForm`, "close" here mimics the flyout being dismissed) and the
    // page's own "Add provider" button, which never touched the URL before this fix.
    return mockReact.createElement(
      'div',
      {
        'data-test-subj': `${page}-marker`,
        'data-auto-open': String(Boolean(props.autoOpenCreateForm)),
      },
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
      props.onNavigateToSettings
        ? mockReact.createElement(
            'button',
            {
              type: 'button',
              onClick: () => props.onNavigateToSettings?.(),
            },
            'add provider CTA',
          )
        : null,
      props.onCreateFormOpenChange
        ? mockReact.createElement(
            'button',
            {
              type: 'button',
              onClick: () => props.onCreateFormOpenChange?.(false),
            },
            'create form closed',
          )
        : null,
      props.onCreateFormOpenChange
        ? mockReact.createElement(
            'button',
            {
              type: 'button',
              onClick: () => props.onCreateFormOpenChange?.(true),
            },
            'add provider button clicked',
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

/** The hash-router's current path: `application.tsx`'s `renderApp` now builds its own hash history
 * internally rather than using the platform-supplied one, so the route lives in the real
 * `window.location.hash` — mirrors `routeFromPathname`'s own "no hash yet means /" fallback. */
function currentPath(): string {
  return window.location.hash.replace(/^#/, '') || '/';
}

/** Mounts the app the way core does, and returns core's unmount callback. The initial route is set
 * by seeding `window.location.hash` BEFORE mounting — `renderApp`'s internal hash history reads
 * whatever is already there when it's created, not a history instance passed in. */
function mountApp(initialPath = '/'): () => void {
  const element = document.createElement('div');
  document.body.append(element);
  registeredLeaveHandler = undefined;
  window.location.hash = `#${initialPath}`;
  let unmount: () => void = () => undefined;
  act(() => {
    unmount = renderApp(coreMock(), {
      element,
      onAppLeave: (handler: AppLeaveHandler) => {
        registeredLeaveHandler = handler;
      },
    } as unknown as AppMountParameters);
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
    window.location.hash = '';
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

  describe('view routing (#8820)', () => {
    it.each([
      ['/', 'chat'],
      ['', 'chat'],
      ['/settings', 'settings'],
      ['/settings/', 'settings'],
      ['/unknown', 'chat'],
    ])('routeFromPathname maps %s to %s', (pathname, expected) => {
      expect(routeFromPathname(pathname)).toBe(expected);
    });

    it('restores the Settings view from the URL on mount (page refresh)', async () => {
      mountApp('/settings');
      await waitFor(() => expect(marker('settings')).not.toBeNull());

      expect(isHidden(marker('settings') as HTMLElement)).toBe(false);
      expect(isHidden(marker('chat') as HTMLElement)).toBe(true);
      expect(mockMountCounts.settings).toBe(3);
    });

    it('pushes /settings to the history when the Settings tab is clicked', async () => {
      mountApp();
      await waitFor(() => expect(marker('chat')).not.toBeNull());

      fireEvent.click(screen.getByText('Settings'));

      await waitFor(() => expect(currentPath()).toBe('/settings'));
      expect(isHidden(marker('settings') as HTMLElement)).toBe(false);
    });

    it('returns to the Chat view on browser back, keeping Settings mounted', async () => {
      mountApp();
      await waitFor(() => expect(marker('chat')).not.toBeNull());
      fireEvent.click(screen.getByText('Settings'));
      await waitFor(() => expect(marker('settings')).not.toBeNull());

      act(() => {
        window.history.back();
      });

      await waitFor(() => expect(currentPath()).toBe('/'));
      expect(isHidden(marker('chat') as HTMLElement)).toBe(false);
      expect(isHidden(marker('settings') as HTMLElement)).toBe(true);
      expect(mockMountCounts.settings).toBe(1);
    });

    it('does not push a duplicate entry when the active tab is clicked again', async () => {
      mountApp();
      await waitFor(() => expect(marker('chat')).not.toBeNull());

      const lengthBefore = window.history.length;
      fireEvent.click(screen.getByText('Chat'));

      expect(window.history.length).toBe(lengthBefore);
      expect(currentPath()).toBe('/');
    });

    it('redirects an unknown deep link back to the Chat tab', async () => {
      mountApp('/unknown');
      await waitFor(() => expect(currentPath()).toBe('/'));

      expect(isHidden(marker('chat') as HTMLElement)).toBe(false);
      expect(marker('settings')).toBeNull();
    });

    it('opens Settings with the add-provider flag from the chat CTA, then strips it once the flyout closes', async () => {
      mountApp();
      await waitFor(() => expect(marker('chat')).not.toBeNull());

      fireEvent.click(screen.getByText('add provider CTA'));

      await waitFor(() => expect(marker('settings')).not.toBeNull());
      expect(currentPath()).toBe('/settings?addProvider=true');
      expect(isHidden(marker('settings') as HTMLElement)).toBe(false);
      expect(marker('settings')).toHaveAttribute('data-auto-open', 'true');

      fireEvent.click(screen.getByText('create form closed'));

      await waitFor(() => expect(currentPath()).toBe('/settings'));
      expect(marker('settings')).toHaveAttribute('data-auto-open', 'false');
    });

    it('adds the add-provider flag to the URL when the create-provider flyout is opened from Settings itself, not just the chat CTA', async () => {
      mountApp();
      await waitFor(() => expect(marker('chat')).not.toBeNull());

      fireEvent.click(screen.getByText('Settings'));
      await waitFor(() => expect(marker('settings')).not.toBeNull());
      expect(currentPath()).toBe('/settings');
      expect(marker('settings')).toHaveAttribute('data-auto-open', 'false');

      // Settings' own "Add provider" button, not the chat CTA: RC2 — the URL must reflect this
      // too, not only a deep link that arrived with the flag already set.
      fireEvent.click(screen.getByText('add provider button clicked'));

      await waitFor(() =>
        expect(currentPath()).toBe('/settings?addProvider=true'),
      );

      fireEvent.click(screen.getByText('create form closed'));

      await waitFor(() => expect(currentPath()).toBe('/settings'));
    });
  });
});
