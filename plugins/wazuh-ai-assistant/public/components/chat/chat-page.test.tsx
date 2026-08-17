import path from 'path';
import fs from 'fs';
import React from 'react';
import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { createBrowserHistory } from 'history';
import { ChatPage, CONVERSATIONS_CHANGED_EVENT } from './chat-page';
import {
  ConversationRecord,
  PersistedChatMessage,
  ProviderSummary,
  StreamEvent,
} from '../../../common/types';

/**
 * First colocated coverage for `chat-page.tsx`, aimed squarely at the ABANDONED-TURN path — what
 * happens to a turn that is still streaming when the user switches conversation, starts a new one,
 * or leaves the app. That path used to lose the answer outright: nothing aborted the stream, so
 * every remaining `updateMessages` call targeted an assistant message id that no longer existed in
 * the replaced list, the auto-save ran against the newly opened conversation's id, and the outgoing
 * turn's pseudonym entries were merged into it.
 *
 * The mocked services are the three this component constructs itself (it takes no service props),
 * so they have to be replaced at the module level. Every factory below only references
 * `mock`-prefixed module-level bindings, which is what babel-plugin-jest-hoist allows inside a
 * hoisted `jest.mock` factory.
 */

const mockStreamChat = jest.fn();
const mockConversationsService = {
  list: jest.fn(),
  create: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};
const mockSettingsService = {
  getAssistantSettings: jest.fn(),
  getSettingsAccess: jest.fn(),
};
const mockEnsureManagerSession = jest.fn();
const mockOpenConfirm = jest.fn();

jest.mock('../../services/chat-service', () => ({
  ChatService: jest.fn().mockImplementation(() => ({
    streamChat: (...args: unknown[]) => mockStreamChat(...args),
  })),
}));

jest.mock('../../services/conversations-service', () => ({
  ConversationsService: jest.fn().mockImplementation(() => ({
    list: (...args: unknown[]) => mockConversationsService.list(...args),
    create: (...args: unknown[]) => mockConversationsService.create(...args),
    get: (...args: unknown[]) => mockConversationsService.get(...args),
    update: (...args: unknown[]) => mockConversationsService.update(...args),
    remove: (...args: unknown[]) => mockConversationsService.remove(...args),
  })),
}));

jest.mock('../../services/settings-service', () => ({
  SettingsService: jest.fn().mockImplementation(() => ({
    getAssistantSettings: () => mockSettingsService.getAssistantSettings(),
    getSettingsAccess: () => mockSettingsService.getSettingsAccess(),
  })),
}));

jest.mock('../../services/session-heal', () => ({
  ensureManagerSession: (...args: unknown[]) =>
    mockEnsureManagerSession(...args),
}));

jest.mock('./discover-link', () => ({
  createDiscoverUrlResolver: () => () => undefined,
}));

const PROVIDER: ProviderSummary = {
  id: 'p1',
  name: 'Test provider',
  type: 'openai_compatible',
  isDefault: true,
} as ProviderSummary;

/**
 * A `streamChat` stand-in the test drives event by event: `push` yields one SSE event to the
 * component, `end` completes the stream normally, and an abort of the passed signal ends it the way
 * a real aborted `fetch` does. `signal` is captured so a test can assert the component actually
 * aborted rather than merely stopping to read.
 */
function createControllableStream() {
  const queue: StreamEvent[] = [];
  let wake: (() => void) | null = null;
  let ended = false;

  const generate = async function* (signal: AbortSignal) {
    for (;;) {
      while (queue.length > 0) {
        yield queue.shift() as StreamEvent;
      }
      if (ended || signal.aborted) {
        return;
      }
      // eslint-disable-next-line no-await-in-loop -- a stream yields its events in order, one park per event
      await new Promise<void>(resolve => {
        wake = resolve;
        signal.addEventListener('abort', resolve, { once: true });
      });
      wake = null;
    }
  };

  return {
    generate,
    push(event: StreamEvent) {
      queue.push(event);
      wake?.();
    },
    end() {
      ended = true;
      wake?.();
    },
  };
}

function conversationRecord(
  overrides: Partial<ConversationRecord> = {},
): ConversationRecord {
  return {
    id: 'conv-b',
    title: 'Older conversation',
    messages: [{ role: 'user', content: 'earlier question' }],
    createdAt: '2024-01-01T09:00:00.000Z',
    updatedAt: '2024-01-01T09:00:00.000Z',
    version: 'v1',
    ...overrides,
  } as ConversationRecord;
}

function renderChatPage(
  overrides: Partial<React.ComponentProps<typeof ChatPage>> = {},
) {
  const core = {
    http: { basePath: { prepend: (path: string) => path } },
    uiSettings: { get: () => false },
    chrome: { setBreadcrumbs: jest.fn() },
    // The interrupt confirmation is the PLATFORM's dialog (overlays.openConfirm), the same one OSD
    // shows when leaving the app — so tests drive the user's answer through this mock rather than
    // clicking a locally rendered modal.
    overlays: { openConfirm: mockOpenConfirm },
  };

  const props: React.ComponentProps<typeof ChatPage> = {
    core: core as never,
    providers: [PROVIDER],
    providersLoaded: true,
    providersError: null,
    selectedProviderId: PROVIDER.id,
    onProviderChange: jest.fn(),
    onNavigateToSettings: jest.fn(),
    // A real browser history, backed by jsdom's own `window.history`/`window.location` — reads
    // whatever path a test seeded via `window.history.replaceState` before mounting, and its own
    // `history.replace` calls are real `replaceState`s a test can assert on via `window.location`.
    history: createBrowserHistory() as never,
    ...overrides,
  };

  const view = render(<ChatPage {...props} />);
  return {
    ...view,
    // Re-renders with the SAME prop identities plus `next`, so only the overridden props change.
    rerenderWith: (next: Partial<React.ComponentProps<typeof ChatPage>>) =>
      view.rerender(<ChatPage {...props} {...next} />),
  };
}

async function sendMessage(text: string) {
  fireEvent.change(screen.getByLabelText('Chat message'), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await waitFor(() => expect(mockStreamChat).toHaveBeenCalled());
}

/** The signal the component passed to `streamChat` on its most recent call. */
function lastStreamSignal(): AbortSignal {
  const call = mockStreamChat.mock.calls[mockStreamChat.mock.calls.length - 1];
  return call[2] as AbortSignal;
}

/** The `messages` array of the last create/update save, whichever ran last. */
function lastSavedMessages(mock: jest.Mock): PersistedChatMessage[] {
  const call = mock.mock.calls[mock.mock.calls.length - 1];
  // create(title, messages) / update(id, title, messages, expectedVersion)
  return (
    mock === mockConversationsService.create ? call[1] : call[2]
  ) as PersistedChatMessage[];
}

/** The last save's transcript reduced to `[role, content]`, for assertions that do not care about
 * the persisted timestamps/tables. */
function lastSavedRoleContent(mock: jest.Mock): Array<[string, string]> {
  return lastSavedMessages(mock).map(message => [
    message.role,
    message.content,
  ]);
}

/**
 * Finds a conversation's SIDEBAR ROW by its title text. Once a conversation is both open (the
 * conversation header now shows its title as an `<h1>`, chat-page.tsx) and listed in the sidebar,
 * the same title string can render twice on screen — `screen.getByText` would then throw on an
 * ambiguous match, so every lookup goes through here instead, which disambiguates by picking the
 * match inside the sidebar's own `[role="button"]` row.
 */
function conversationRow(title: string): HTMLElement {
  const row = screen
    .getAllByText(title)
    .map(element => element.closest('[role="button"]'))
    .find((element): element is HTMLElement => element !== null);
  if (!row) {
    throw new Error(`No conversation row found for "${title}"`);
  }
  return row;
}

/**
 * Opens another conversation from the sidebar. A mid-stream switch asks for confirmation first
 * (`overlays.openConfirm`, mocked to accept by default), so every such switch in these tests goes
 * through here rather than assuming a bare click is enough.
 */
async function leaveForConversation(title: string) {
  fireEvent.click(conversationRow(title));
  await waitFor(() => expect(mockConversationsService.get).toHaveBeenCalled());
}

/** An http error shaped the way `common/http-status.ts` reads a status off an OSD http failure. */
function httpError(status: number): Error & { response: { status: number } } {
  return Object.assign(new Error(`HTTP ${status}`), {
    response: { status },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: the user confirms. Tests that care about declining override this.
  mockOpenConfirm.mockResolvedValue(true);
  // The conversation route now lives in the pathname (`/conversation/:id`, not a hash fragment —
  // see `conversation-location.ts`), so it's reset the same way the component itself writes it:
  // through the History API, not a direct `window.location` assignment (jsdom does not implement
  // real navigation for that, only for pushState/replaceState-driven changes).
  window.history.replaceState(null, '', '/');
  window.sessionStorage.clear();
  // startTurn awaits this pre-turn guard; `null` (probe failed, fail-open) is the neutral default.
  mockEnsureManagerSession.mockResolvedValue(null);
  mockSettingsService.getAssistantSettings.mockResolvedValue({
    privacyDefaultOn: false,
    privacyDefaultPerProvider: {},
    userCanOverride: true,
    conversationRetentionDays: 0,
  });
  mockSettingsService.getSettingsAccess.mockResolvedValue({
    administrator: true,
    message: null,
    defaultApiHostId: null,
  });
  mockConversationsService.list.mockResolvedValue([]);
  mockConversationsService.create.mockResolvedValue(
    conversationRecord({ id: 'conv-new', version: 'v1' }),
  );
  mockConversationsService.update.mockResolvedValue(
    conversationRecord({ version: 'v2' }),
  );
  mockConversationsService.get.mockResolvedValue(conversationRecord());
});

describe('ChatPage — turn abandoned mid-stream', () => {
  it('aborts the in-flight stream when the user opens another conversation', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    mockConversationsService.list.mockResolvedValue([
      { id: 'conv-b', title: 'Older conversation', updatedAt: '2024-01-01' },
    ]);

    renderChatPage();
    await waitFor(() =>
      expect(conversationRow('Older conversation')).toBeInTheDocument(),
    );
    await sendMessage('first question');
    stream.push({ type: 'delta', content: 'partial ' });

    const signal = lastStreamSignal();
    expect(signal.aborted).toBe(false);

    await leaveForConversation('Older conversation');

    await waitFor(() => expect(signal.aborted).toBe(true));
  });

  it('persists the abandoned turn to the conversation it started in, not the one just opened', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    mockConversationsService.list.mockResolvedValue([
      { id: 'conv-b', title: 'Older conversation', updatedAt: '2024-01-01' },
    ]);

    renderChatPage();
    await waitFor(() =>
      expect(conversationRow('Older conversation')).toBeInTheDocument(),
    );
    await sendMessage('first question');
    stream.push({ type: 'delta', content: 'partial answer' });
    await waitFor(() =>
      expect(screen.getByText('partial answer')).toBeInTheDocument(),
    );

    await leaveForConversation('Older conversation');

    // The question was already saved (POST) before the stream started, creating conv-new; the
    // abandoned turn UPDATES that same row with the answer it managed to produce. Exactly one row
    // exists for it, and conv-b — the conversation now on screen — is never written to.
    await waitFor(() =>
      expect(mockConversationsService.update).toHaveBeenCalledTimes(1),
    );
    expect(mockConversationsService.create).toHaveBeenCalledTimes(1);
    expect(mockConversationsService.update.mock.calls[0][0]).toBe('conv-new');
    expect(lastSavedRoleContent(mockConversationsService.update)).toEqual([
      ['user', 'first question'],
      ['assistant', 'partial answer'],
    ]);
  });

  it('saves the question before generating, so a turn cut short still has it', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await waitFor(() =>
      expect(
        screen.getByText('Ask the AI Assistant something'),
      ).toBeInTheDocument(),
    );
    await sendMessage('first question');

    // Nothing has streamed back yet: the conversation already exists, carrying the question alone.
    await waitFor(() =>
      expect(mockConversationsService.create).toHaveBeenCalledTimes(1),
    );
    expect(lastSavedRoleContent(mockConversationsService.create)).toEqual([
      ['user', 'first question'],
    ]);
  });

  it('does not write an abandoned turn’s late events into the conversation now on screen', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    mockConversationsService.list.mockResolvedValue([
      { id: 'conv-b', title: 'Older conversation', updatedAt: '2024-01-01' },
    ]);

    renderChatPage();
    await waitFor(() =>
      expect(conversationRow('Older conversation')).toBeInTheDocument(),
    );
    await sendMessage('first question');
    stream.push({ type: 'delta', content: 'partial answer' });
    await waitFor(() =>
      expect(screen.getByText('partial answer')).toBeInTheDocument(),
    );

    await leaveForConversation('Older conversation');
    await waitFor(() =>
      expect(screen.getByText('earlier question')).toBeInTheDocument(),
    );

    // A delta that arrives after the switch (the abort has not necessarily been observed by the
    // provider yet) must not reach the resumed conversation's transcript.
    stream.push({ type: 'delta', content: 'LATE TEXT' });
    stream.end();

    await waitFor(() =>
      expect(mockConversationsService.create).toHaveBeenCalled(),
    );
    expect(screen.queryByText(/LATE TEXT/)).not.toBeInTheDocument();
    expect(screen.queryByText('partial answer')).not.toBeInTheDocument();
  });

  it('re-enables the input for the newly opened conversation', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    mockConversationsService.list.mockResolvedValue([
      { id: 'conv-b', title: 'Older conversation', updatedAt: '2024-01-01' },
    ]);

    renderChatPage();
    await waitFor(() =>
      expect(conversationRow('Older conversation')).toBeInTheDocument(),
    );
    await sendMessage('first question');
    expect(screen.getByLabelText('Chat message')).toBeDisabled();

    await leaveForConversation('Older conversation');

    await waitFor(() =>
      expect(screen.getByLabelText('Chat message')).toBeEnabled(),
    );
  });

  it('keeps a stopped turn attached to the active conversation', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('first question');
    stream.push({ type: 'delta', content: 'partial answer' });
    await waitFor(() =>
      expect(screen.getByText('partial answer')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    // Stop is NOT abandonment: what streamed in stays on screen and is saved as this
    // conversation's first turn, so the next turn updates that same row instead of creating a
    // second one.
    await waitFor(() =>
      expect(mockConversationsService.create).toHaveBeenCalledTimes(1),
    );
    expect(screen.getByText('partial answer')).toBeInTheDocument();
    expect(lastSavedRoleContent(mockConversationsService.update)).toEqual([
      ['user', 'first question'],
      ['assistant', 'partial answer'],
    ]);
  });

  it('aborts and preserves the turn when a new conversation is started mid-stream', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('first question');
    stream.push({ type: 'delta', content: 'partial answer' });
    await waitFor(() =>
      expect(screen.getByText('partial answer')).toBeInTheDocument(),
    );

    const signal = lastStreamSignal();
    // getByRole (not getByText): the conversation header's own "New conversation" fallback
    // title (chat-page.tsx, shown while no conversation is active) can render the exact same
    // string at the same time as this sidebar button.
    fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));

    await waitFor(() => expect(signal.aborted).toBe(true));
    await waitFor(() =>
      expect(mockConversationsService.create).toHaveBeenCalledTimes(1),
    );
    expect(screen.queryByText('partial answer')).not.toBeInTheDocument();
  });

  it('aborts the in-flight stream on unmount', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    const { unmount } = renderChatPage();
    await sendMessage('first question');
    stream.push({ type: 'delta', content: 'partial answer' });
    await waitFor(() =>
      expect(screen.getByText('partial answer')).toBeInTheDocument(),
    );

    const signal = lastStreamSignal();
    unmount();

    await waitFor(() => expect(signal.aborted).toBe(true));
    // Leaving the app (tab switch, navigating to another dashboard app) still saves the turn.
    await waitFor(() =>
      expect(mockConversationsService.create).toHaveBeenCalledTimes(1),
    );
  });

  it('does not carry an abandoned turn’s pseudonyms into the next request', async () => {
    const firstStream = createControllableStream();
    const secondStream = createControllableStream();
    mockStreamChat
      .mockImplementationOnce((_providerId, _messages, signal: AbortSignal) =>
        firstStream.generate(signal),
      )
      .mockImplementationOnce((_providerId, _messages, signal: AbortSignal) =>
        secondStream.generate(signal),
      );
    mockConversationsService.list.mockResolvedValue([
      { id: 'conv-b', title: 'Older conversation', updatedAt: '2024-01-01' },
    ]);

    renderChatPage();
    await waitFor(() =>
      expect(conversationRow('Older conversation')).toBeInTheDocument(),
    );
    await sendMessage('first question');
    firstStream.push({
      type: 'privacy_map',
      entries: [{ pseudonym: 'HOST_1', value: 'web-01', kind: 'hostname' }],
    } as StreamEvent);
    firstStream.push({ type: 'delta', content: 'partial answer' });
    await waitFor(() =>
      expect(screen.getByText('partial answer')).toBeInTheDocument(),
    );

    await leaveForConversation('Older conversation');
    await waitFor(() =>
      expect(screen.getByLabelText('Chat message')).toBeEnabled(),
    );
    await sendMessage('second question');

    // privacy payload is the 4th argument of streamChat; the map minted for the abandoned
    // conversation must not be reseeded into this one.
    const privacyPayload = mockStreamChat.mock.calls[1][3];
    expect(privacyPayload).toBeUndefined();
  });
});

describe('ChatPage — restoring the open conversation', () => {
  it('restores the conversation named by the URL route on mount', async () => {
    window.history.replaceState(null, '', '/conversation/conv-b');

    renderChatPage();

    await waitFor(() =>
      expect(screen.getByText('earlier question')).toBeInTheDocument(),
    );
    expect(mockConversationsService.get).toHaveBeenCalledWith('conv-b');
  });

  it('falls back to this tab’s stored pointer when the URL carries no conversation', async () => {
    window.sessionStorage.setItem(
      'wazuhAiAssistant.lastConversation',
      'conv-b',
    );

    renderChatPage();

    await waitFor(() =>
      expect(screen.getByText('earlier question')).toBeInTheDocument(),
    );
    expect(mockConversationsService.get).toHaveBeenCalledWith('conv-b');
  });

  it('prefers the URL route over the stored pointer', async () => {
    window.history.replaceState(null, '', '/conversation/conv-from-url');
    window.sessionStorage.setItem(
      'wazuhAiAssistant.lastConversation',
      'conv-from-storage',
    );
    mockConversationsService.get.mockResolvedValue(
      conversationRecord({ id: 'conv-from-url' }),
    );

    renderChatPage();

    await waitFor(() =>
      expect(mockConversationsService.get).toHaveBeenCalledWith(
        'conv-from-url',
      ),
    );
    expect(mockConversationsService.get).toHaveBeenCalledTimes(1);
  });

  it('does not fetch anything when there is nothing to restore', async () => {
    renderChatPage();

    await waitFor(() =>
      expect(
        screen.getByText('Ask the AI Assistant something'),
      ).toBeInTheDocument(),
    );
    expect(mockConversationsService.get).not.toHaveBeenCalled();
  });

  it('starts clean and forgets the pointer when the conversation is gone', async () => {
    window.history.replaceState(null, '', '/conversation/conv-gone');
    window.sessionStorage.setItem(
      'wazuhAiAssistant.lastConversation',
      'conv-gone',
    );
    mockConversationsService.get.mockRejectedValue(httpError(404));

    renderChatPage();

    // The welcome state, not an error banner: a deleted or retention-pruned conversation is an
    // expected outcome, not a failure the user can act on.
    await waitFor(() =>
      expect(
        screen.getByText('Ask the AI Assistant something'),
      ).toBeInTheDocument(),
    );
    expect(
      screen.queryByText('Could not load that conversation.'),
    ).not.toBeInTheDocument();
    expect(
      window.sessionStorage.getItem('wazuhAiAssistant.lastConversation'),
    ).toBeNull();
    expect(window.location.pathname).toBe('/');
  });

  it('keeps the pointer and reports the failure when the load fails for another reason', async () => {
    window.history.replaceState(null, '', '/conversation/conv-b');
    window.sessionStorage.setItem(
      'wazuhAiAssistant.lastConversation',
      'conv-b',
    );
    mockConversationsService.get.mockRejectedValue(httpError(503));

    renderChatPage();

    await waitFor(() =>
      expect(
        screen.getByText('Could not load that conversation.'),
      ).toBeInTheDocument(),
    );
    expect(
      window.sessionStorage.getItem('wazuhAiAssistant.lastConversation'),
    ).toBe('conv-b');
  });

  it('records the conversation created by the first completed turn', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await waitFor(() =>
      expect(
        screen.getByText('Ask the AI Assistant something'),
      ).toBeInTheDocument(),
    );
    await sendMessage('first question');
    stream.push({ type: 'delta', content: 'an answer' });
    stream.end();

    await waitFor(() =>
      expect(mockConversationsService.create).toHaveBeenCalled(),
    );
    // conv-new is the id the mocked POST returns — a later reload now lands back in this
    // conversation instead of an empty chat.
    await waitFor(() =>
      expect(window.location.pathname).toBe('/conversation/conv-new'),
    );
    expect(
      window.sessionStorage.getItem('wazuhAiAssistant.lastConversation'),
    ).toBe('conv-new');
  });

  it('clears the recorded conversation when the user starts a new one', async () => {
    window.history.replaceState(null, '', '/conversation/conv-b');

    renderChatPage();
    await waitFor(() =>
      expect(screen.getByText('earlier question')).toBeInTheDocument(),
    );

    // getByRole (not getByText): the conversation header's own "New conversation" fallback
    // title (chat-page.tsx, shown while no conversation is active) can render the exact same
    // string at the same time as this sidebar button.
    fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));

    await waitFor(() => expect(window.location.pathname).toBe('/'));
    expect(
      window.sessionStorage.getItem('wazuhAiAssistant.lastConversation'),
    ).toBeNull();
  });

  it('does not write the conversation route while the chat view is hidden', async () => {
    window.sessionStorage.setItem(
      'wazuhAiAssistant.lastConversation',
      'conv-b',
    );

    renderChatPage({ isActive: false });

    await waitFor(() =>
      expect(screen.getByText('earlier question')).toBeInTheDocument(),
    );
    expect(window.location.pathname).toBe('/');
  });

  it('re-syncs the route when the chat view becomes active again', async () => {
    window.sessionStorage.setItem(
      'wazuhAiAssistant.lastConversation',
      'conv-b',
    );

    const view = renderChatPage({ isActive: false });
    await waitFor(() =>
      expect(screen.getByText('earlier question')).toBeInTheDocument(),
    );
    expect(window.location.pathname).toBe('/');

    view.rerenderWith({ isActive: true });

    await waitFor(() =>
      expect(window.location.pathname).toBe('/conversation/conv-b'),
    );
  });

  it('hides the saved-conversations sidebar when showConversationSidebar is false', () => {
    const view = renderChatPage({ showConversationSidebar: false });

    // getByRole (not getByText): the conversation header's own "New conversation" fallback
    // title (chat-page.tsx) can render the exact same string as this sidebar button.
    expect(
      screen.queryByRole('button', { name: 'New conversation' }),
    ).toBeNull();

    view.rerenderWith({ showConversationSidebar: true });
    expect(
      screen.getByRole('button', { name: 'New conversation' }),
    ).toBeInTheDocument();
  });
});

describe('ChatPage — a resumed conversation is the same conversation', () => {
  it('restores past timestamps rather than stamping everything with the resume time', async () => {
    const savedAt = Date.parse('2024-01-01T09:00:00.000Z');
    mockConversationsService.get.mockResolvedValue(
      conversationRecord({
        messages: [
          { role: 'user', content: 'earlier question', createdAt: savedAt },
          { role: 'assistant', content: 'earlier answer', createdAt: savedAt },
        ],
      }),
    );
    window.history.replaceState(null, '', '/conversation/conv-b');

    renderChatPage();

    await waitFor(() =>
      expect(screen.getByText('earlier answer')).toBeInTheDocument(),
    );
    // message-bubble.tsx renders each message's own time, formatted in the viewer's locale — so the
    // expected string is derived the same way rather than hardcoded.
    const savedLabel = new Date(savedAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const nowLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    expect(savedLabel).not.toBe(nowLabel);
    expect(screen.getAllByText(savedLabel).length).toBe(2);
    expect(screen.queryByText(nowLabel)).not.toBeInTheDocument();
  });

  it('restores the result table a past answer was shown with', async () => {
    mockConversationsService.get.mockResolvedValue(
      conversationRecord({
        messages: [
          { role: 'user', content: 'top agents?', createdAt: 1 },
          {
            role: 'assistant',
            content: 'here they are',
            createdAt: 2,
            table: {
              columns: [{ id: 'agent', label: 'Agent' }],
              rows: [{ agent: 'web-01' }],
            },
          },
        ],
      }),
    );
    window.history.replaceState(null, '', '/conversation/conv-b');

    renderChatPage();

    await waitFor(() =>
      expect(screen.getByText('here they are')).toBeInTheDocument(),
    );
    expect(screen.getByText('web-01')).toBeInTheDocument();
  });

  it('resends the restored tool history with the next question', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    mockConversationsService.get.mockResolvedValue(
      conversationRecord({
        messages: [
          { role: 'user', content: 'how many?', createdAt: 1 },
          {
            role: 'assistant',
            content: '',
            toolCalls: [
              { id: 't1', name: 'search_wazuh_data', arguments: { size: 1 } },
            ],
          },
          { role: 'tool', content: '{"count":42}', toolCallId: 't1' },
          { role: 'assistant', content: '42 alerts', createdAt: 2 },
        ],
      }),
    );
    window.history.replaceState(null, '', '/conversation/conv-b');

    renderChatPage();
    await waitFor(() =>
      expect(screen.getByText('42 alerts')).toBeInTheDocument(),
    );
    // The tool pair is history, not a bubble.
    expect(screen.queryByText('{"count":42}')).not.toBeInTheDocument();

    await sendMessage('and yesterday?');

    // Without the restored tool history the model would have seen prose only and re-run the query.
    const sentMessages = mockStreamChat.mock
      .calls[0][1] as PersistedChatMessage[];
    expect(sentMessages.map(message => message.role)).toEqual([
      'user',
      'assistant',
      'tool',
      'assistant',
      'user',
    ]);
    expect(sentMessages[2].content).toBe('{"count":42}');
    expect(sentMessages[1].toolCalls?.[0].id).toBe('t1');
  });
});

describe('ChatPage — interrupted turns and failed saves', () => {
  it('labels a stopped answer as interrupted and offers a retry', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('first question');
    stream.push({ type: 'delta', content: 'half an ans' });
    await waitFor(() =>
      expect(screen.getByText('half an ans')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));

    await waitFor(() =>
      expect(screen.getByText('Response interrupted')).toBeInTheDocument(),
    );
    expect(screen.getByText('Retry')).toBeInTheDocument();
    // The partial answer is persisted AS interrupted, so a reload does not present it as finished.
    await waitFor(() =>
      expect(mockConversationsService.update).toHaveBeenCalled(),
    );
    const saved = lastSavedMessages(mockConversationsService.update);
    expect(saved[saved.length - 1].interrupted).toBe(true);
  });

  it('does not label a completed answer as interrupted', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('first question');
    stream.push({ type: 'delta', content: 'a full answer' });
    stream.push({ type: 'done' });
    stream.end();

    await waitFor(() =>
      expect(mockConversationsService.update).toHaveBeenCalled(),
    );
    expect(screen.queryByText('Response interrupted')).not.toBeInTheDocument();
    const saved = lastSavedMessages(mockConversationsService.update);
    expect(saved[saved.length - 1].interrupted).toBeUndefined();
  });

  it('retrying replaces the interrupted answer instead of appending a second one', async () => {
    const first = createControllableStream();
    const second = createControllableStream();
    mockStreamChat
      .mockImplementationOnce((_providerId, _messages, signal: AbortSignal) =>
        first.generate(signal),
      )
      .mockImplementationOnce((_providerId, _messages, signal: AbortSignal) =>
        second.generate(signal),
      );

    renderChatPage();
    await sendMessage('first question');
    first.push({ type: 'delta', content: 'half an ans' });
    await waitFor(() =>
      expect(screen.getByText('half an ans')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }));
    await waitFor(() =>
      expect(screen.getByText('Response interrupted')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(mockStreamChat).toHaveBeenCalledTimes(2));
    second.push({ type: 'delta', content: 'the whole answer' });
    second.push({ type: 'done' });
    second.end();

    await waitFor(() =>
      expect(screen.getByText('the whole answer')).toBeInTheDocument(),
    );
    // The partial answer is gone, and the question was not asked twice.
    expect(screen.queryByText('half an ans')).not.toBeInTheDocument();
    expect(screen.getAllByText('first question')).toHaveLength(1);
    // The retry re-sends the SAME question, with no stale assistant turn in the history.
    const resentRoles = (
      mockStreamChat.mock.calls[1][1] as PersistedChatMessage[]
    ).map(message => message.role);
    expect(resentRoles).toEqual(['user']);
  });

  it('tells the user when the conversation could not be saved, and stops once a save succeeds', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    mockConversationsService.create.mockRejectedValueOnce(httpError(413));

    renderChatPage();
    await sendMessage('first question');

    await waitFor(() =>
      expect(
        screen.getByText('This conversation is not being saved'),
      ).toBeInTheDocument(),
    );

    // The next turn's save succeeds and the notice goes away on its own.
    stream.push({ type: 'delta', content: 'an answer' });
    stream.push({ type: 'done' });
    stream.end();

    await waitFor(() =>
      expect(
        screen.queryByText('This conversation is not being saved'),
      ).not.toBeInTheDocument(),
    );
  });

  it('"Retry now" on the save-failed callout re-saves through the same path and clears the notice on success, without creating a second conversation', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    // Persistent failure: both this turn's pre-send AND post-answer saves fail, so the notice is
    // still up (with nothing else left to auto-retry it) when the user clicks the button.
    mockConversationsService.create.mockRejectedValue(httpError(500));

    renderChatPage();
    await sendMessage('first question');
    await waitFor(() =>
      expect(
        screen.getByText('This conversation is not being saved'),
      ).toBeInTheDocument(),
    );
    stream.push({ type: 'delta', content: 'an answer' });
    stream.push({ type: 'done' });
    stream.end();
    await waitFor(() =>
      expect(mockConversationsService.create).toHaveBeenCalledTimes(2),
    );
    expect(
      screen.getByText('This conversation is not being saved'),
    ).toBeInTheDocument();

    // Whatever was blocking the save is now fixed — the next attempt succeeds.
    mockConversationsService.create.mockResolvedValueOnce(
      conversationRecord({ id: 'conv-retried', version: 'v1' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry now' }));

    await waitFor(() =>
      expect(
        screen.queryByText('This conversation is not being saved'),
      ).not.toBeInTheDocument(),
    );
    // Exactly one more `create` call — the retry reuses `persistConversationTurn`, not a second
    // save implementation — and the conversation it just created becomes this tab's active one,
    // never a second row: the update.mock check confirms this by targeting that id.
    expect(mockConversationsService.create).toHaveBeenCalledTimes(3);
    const [title, messages] = mockConversationsService.create.mock.calls[2];
    expect(title).toBeTruthy();
    expect(messages[messages.length - 1].content).toBe('an answer');

    // A later turn updates the row the retry created instead of creating another one.
    await sendMessage('second question');
    await waitFor(() =>
      expect(mockConversationsService.update).toHaveBeenCalled(),
    );
    expect(mockConversationsService.update.mock.calls[0][0]).toBe(
      'conv-retried',
    );
    expect(mockConversationsService.create).toHaveBeenCalledTimes(3);
  });

  it('disables "Retry now" while a turn is generating, so it cannot double-create the conversation', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    // The pre-send save (before any streaming starts) fails first, raising the callout while the
    // turn is still generating; the post-answer save that follows once the stream ends succeeds.
    mockConversationsService.create
      .mockRejectedValueOnce(httpError(500))
      .mockResolvedValueOnce(
        conversationRecord({ id: 'conv-new', version: 'v1' }),
      );

    renderChatPage();
    await sendMessage('first question');
    await waitFor(() =>
      expect(
        screen.getByText('This conversation is not being saved'),
      ).toBeInTheDocument(),
    );
    expect(mockConversationsService.create).toHaveBeenCalledTimes(1);

    // The turn is still streaming: clicking "Retry now" here must be a no-op — it is disabled
    // precisely so this window (the in-flight turn's own target not yet resolved, per
    // `handleRetrySave`'s doc comment) can never race the turn's own saves into a second create.
    const retryButton = screen.getByRole('button', { name: 'Retry now' });
    expect(retryButton).toBeDisabled();
    fireEvent.click(retryButton);
    expect(mockConversationsService.create).toHaveBeenCalledTimes(1);

    stream.push({ type: 'delta', content: 'an answer' });
    stream.push({ type: 'done' });
    stream.end();

    // Only the turn's own post-answer save creates the row — never a second one from the blocked
    // retry click.
    await waitFor(() =>
      expect(
        screen.queryByText('This conversation is not being saved'),
      ).not.toBeInTheDocument(),
    );
    expect(mockConversationsService.create).toHaveBeenCalledTimes(2);
  });

  it('does not raise the save notice for a 401, which has its own callout', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    mockConversationsService.create.mockRejectedValue(httpError(401));

    renderChatPage();
    await sendMessage('first question');

    await waitFor(() =>
      expect(screen.getByText('Your session expired')).toBeInTheDocument(),
    );
    expect(
      screen.queryByText('This conversation is not being saved'),
    ).not.toBeInTheDocument();
  });

  it('restores an interrupted answer as interrupted', async () => {
    mockConversationsService.get.mockResolvedValue(
      conversationRecord({
        messages: [
          { role: 'user', content: 'earlier question', createdAt: 1 },
          {
            role: 'assistant',
            content: 'half an ans',
            createdAt: 2,
            interrupted: true,
          },
        ],
      }),
    );
    window.history.replaceState(null, '', '/conversation/conv-b');

    renderChatPage();

    await waitFor(() =>
      expect(screen.getByText('half an ans')).toBeInTheDocument(),
    );
    expect(screen.getByText('Response interrupted')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});

describe('ChatPage — an unanswered question is a retryable turn', () => {
  it('offers a retry for a restored conversation that ends on a question', async () => {
    // What a reload mid-answer leaves behind: the question was saved before generating started, and
    // nothing survived to mark an assistant message as interrupted.
    mockConversationsService.get.mockResolvedValue(
      conversationRecord({
        messages: [{ role: 'user', content: 'earlier question', createdAt: 1 }],
      }),
    );
    window.history.replaceState(null, '', '/conversation/conv-b');

    renderChatPage();

    await waitFor(() =>
      expect(screen.getByText('earlier question')).toBeInTheDocument(),
    );
    expect(screen.getByText('Response interrupted')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('retrying an unanswered question re-asks it without duplicating it', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    mockConversationsService.get.mockResolvedValue(
      conversationRecord({
        messages: [{ role: 'user', content: 'earlier question', createdAt: 1 }],
      }),
    );
    window.history.replaceState(null, '', '/conversation/conv-b');

    renderChatPage();
    await waitFor(() => expect(screen.getByText('Retry')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(mockStreamChat).toHaveBeenCalledTimes(1));
    stream.push({ type: 'delta', content: 'the answer' });
    stream.push({ type: 'done' });
    stream.end();

    await waitFor(() =>
      expect(screen.getByText('the answer')).toBeInTheDocument(),
    );
    expect(screen.getAllByText('earlier question')).toHaveLength(1);
    expect(screen.queryByText('Response interrupted')).not.toBeInTheDocument();
    expect(
      (mockStreamChat.mock.calls[0][1] as PersistedChatMessage[]).map(
        message => message.content,
      ),
    ).toEqual(['earlier question']);
  });

  it('does not offer a retry while a turn is generating', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('first question');

    // The transcript momentarily ends on the question, but a turn IS running for it.
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });
});

describe('ChatPage — feedback while a turn runs', () => {
  it('shows placeholder lines until the first token arrives, then the text', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    const { container } = renderChatPage();
    await sendMessage('first question');

    await waitFor(() =>
      expect(
        container.querySelectorAll('.euiLoadingContent').length,
      ).toBeGreaterThan(0),
    );

    stream.push({ type: 'delta', content: 'the answer' });

    await waitFor(() =>
      expect(screen.getByText('the answer')).toBeInTheDocument(),
    );
    expect(container.querySelectorAll('.euiLoadingContent')).toHaveLength(0);
  });

  it('holds the result table back until the answer text starts arriving', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('top agents?');

    // The real wire order for one tool call: tool_call, then table, then digest.
    stream.push({
      type: 'tool_call',
      toolCall: { id: 't1', name: 'get_top_agents', arguments: {} },
    });
    stream.push({
      type: 'table',
      spec: {
        columns: [{ id: 'agent', label: 'Agent' }],
        rows: [{ agent: 'web-01' }],
      },
    });
    // The `digest` event that follows must not release the held table — it is held until TEXT
    // arrives, not until the next non-delta event comes along.
    stream.push({ type: 'digest', toolCallId: 't1', content: '{}' });
    // The chip's label is derived from the tool call itself (name + time range), not from the
    // table, so it appears with its final text even while the table is still held.
    await waitFor(() =>
      expect(screen.getByText('Top agents · 90d')).toBeInTheDocument(),
    );
    expect(screen.queryByText('web-01')).not.toBeInTheDocument();

    stream.push({ type: 'delta', content: 'here they are' });

    await waitFor(() =>
      expect(screen.getByText('here they are')).toBeInTheDocument(),
    );
    expect(screen.getByText('web-01')).toBeInTheDocument();
  });

  it('still shows a held table when the turn ends without any answer text', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('top agents?');

    stream.push({
      type: 'table',
      spec: {
        columns: [{ id: 'agent', label: 'Agent' }],
        rows: [{ agent: 'web-01' }],
      },
    });
    stream.push({ type: 'done' });
    stream.end();

    await waitFor(() => expect(screen.getByText('web-01')).toBeInTheDocument());
  });

  it('keeps a held table when the turn errors before narrating anything', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('top agents?');

    stream.push({
      type: 'table',
      spec: {
        columns: [{ id: 'agent', label: 'Agent' }],
        rows: [{ agent: 'web-01' }],
      },
    });
    stream.push({ type: 'error', message: 'provider stream failed' });
    stream.end();

    await waitFor(() => expect(screen.getByText('web-01')).toBeInTheDocument());
  });

  it('shows the query that was executed, with its arguments', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('how many alerts?');
    stream.push({
      type: 'tool_call',
      toolCall: {
        id: 't1',
        name: 'search_wazuh_data',
        arguments: { index_pattern: 'wazuh-alerts-*', size: 5 },
      },
    });

    // No table event this turn, so the chip's label is derived purely from the tool call itself:
    // its humanized name plus the default 90-day time window.
    await waitFor(() =>
      expect(screen.getByText('Wazuh data · 90d')).toBeInTheDocument(),
    );
    // Raw arguments are one click deeper, not on screen unbidden.
    expect(screen.queryByText(/wazuh-alerts-\*/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Wazuh data · 90d'));
    expect(await screen.findByText(/wazuh-alerts-\*/)).toBeInTheDocument();
  });

  it('shows the executed queries again on a resumed conversation', async () => {
    mockConversationsService.get.mockResolvedValue(
      conversationRecord({
        messages: [
          { role: 'user', content: 'how many?', createdAt: 1 },
          {
            role: 'assistant',
            content: '',
            toolCalls: [
              {
                id: 't1',
                name: 'search_wazuh_data',
                arguments: { index_pattern: 'wazuh-alerts-*' },
              },
            ],
          },
          { role: 'tool', content: '{"count":42}', toolCallId: 't1' },
          { role: 'assistant', content: '42 alerts', createdAt: 2 },
        ],
      }),
    );
    window.history.replaceState(null, '', '/conversation/conv-b');

    renderChatPage();

    await waitFor(() =>
      expect(screen.getByText('42 alerts')).toBeInTheDocument(),
    );
    // No discover info on this restored table, but the chip's label doesn't need it — it's
    // derived from the tool call itself, same as on a live turn.
    expect(screen.getByText('Wazuh data · 90d')).toBeInTheDocument();
  });
});

/**
 * Coverage for issue #8920 item 7: a populated result table must never be overwritten by an empty
 * one at end-of-stream. `chat-page.tsx` flushes its held table buffers (`pendingTable`,
 * `pendingEmptyTable`) from three different call sites — `finally`, the `error` branch, and the
 * `auth_expired` branch — and they do not all flush in the same order (`finally`/`auth_expired`
 * flush the non-empty one first; `error` flushes the empty one first). On the unfixed code only
 * `finally` was reachably broken: `error`'s empty-first order happened to be benign (the later
 * non-empty commit won) and `auth_expired` fires on the initial POST's 401 before any SSE frame
 * is read, so it can never hold a table. "Happens to be benign" is still worth pinning.
 * The class fix is an order-INDEPENDENT invariant (see the `pendingEmptyTable` comment above it):
 * an empty spec is refused on arrival once a non-empty table exists for the turn, and
 * `flushPendingEmptyTable` independently yields to any pending/committed non-empty table.
 *
 * This is the UI-layer equivalent of the registry-wide coverage tests elsewhere in this codebase
 * (see server/tools/catalog/agg-size-coverage.test.ts): the class here is "orderings of table
 * events within one turn", and the five scenarios below enumerate it exhaustively for the
 * single-table-per-message model — every place an empty `table` event can land relative to a
 * non-empty one, plus the one honest-empty case that must still render.
 */
describe('ChatPage — an empty table never clobbers a populated one (issue #8920 item 7)', () => {
  const ROWS_SPEC = {
    columns: [{ id: 'agent', label: 'Agent' }],
    rows: [{ agent: 'web-01' }],
  };
  const EMPTY_SPEC = { columns: [{ id: 'agent', label: 'Agent' }], rows: [] };

  it('keeps the populated table when an empty one arrives after the answer text (text-flush path)', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('top agents?');

    stream.push({ type: 'table', spec: ROWS_SPEC });
    // The delta's text releases `pendingTable` into `committedTable` — by the time the empty table
    // below arrives, the non-empty one is no longer "pending", it is already committed, which is
    // exactly why `hasNonEmptyTableForTurn` also checks `committedTable`, not just `pendingTable`.
    stream.push({ type: 'delta', content: 'here they are' });
    await waitFor(() =>
      expect(screen.getByText('here they are')).toBeInTheDocument(),
    );
    stream.push({ type: 'table', spec: EMPTY_SPEC });
    stream.push({ type: 'done' });
    stream.end();

    await waitFor(() => expect(screen.getByText('web-01')).toBeInTheDocument());
    expect(screen.queryByText('Results (0 rows)')).not.toBeInTheDocument();
  });

  it('keeps the populated table when an empty one arrives with no answer text (finally-path)', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('top agents?');

    // No delta text this turn: both tables reach `finally` still held (`pendingTable` non-empty,
    // the empty spec never even makes it into `pendingEmptyTable` — refused on arrival).
    stream.push({ type: 'table', spec: ROWS_SPEC });
    stream.push({ type: 'table', spec: EMPTY_SPEC });
    stream.push({ type: 'done' });
    stream.end();

    await waitFor(() => expect(screen.getByText('web-01')).toBeInTheDocument());
    expect(screen.queryByText('Results (0 rows)')).not.toBeInTheDocument();
  });

  it('shows the retried table when an empty attempt is followed by a real one', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('top agents?');

    // A failed/empty first tool attempt, then a successful retry in the same turn — the suppression
    // this buffer exists for in the first place must still work in the other direction.
    stream.push({ type: 'table', spec: EMPTY_SPEC });
    stream.push({ type: 'table', spec: ROWS_SPEC });
    stream.push({ type: 'done' });
    stream.end();

    await waitFor(() => expect(screen.getByText('web-01')).toBeInTheDocument());
  });

  it('still shows an honest empty table when it is the only table this turn', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('top agents?');

    stream.push({ type: 'table', spec: EMPTY_SPEC });
    stream.push({ type: 'done' });
    stream.end();

    await waitFor(() =>
      expect(screen.getByText('Results (0 rows)')).toBeInTheDocument(),
    );
  });

  it('keeps the populated table when an empty one arrives and the turn then errors', async () => {
    // The `error` call site's cell of the matrix: rows, THEN an empty table, THEN a mid-stream
    // provider error. The `error` branch is the one call site that flushes the EMPTY buffer
    // before the non-empty one (`flushPendingEmptyTable()` then `flushPendingTable()`) — on the
    // unfixed code that order happened to be benign (the later non-empty commit won), but this
    // scenario pins the cell so a future reorder of the `error` branch, or a change to which
    // commit "wins", cannot silently reintroduce the clobber at this call site. With the fix the
    // empty spec is already refused on arrival, so both halves of the invariant are exercised on
    // the path that ends in `error` rather than `finally`.
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('top agents?');

    stream.push({ type: 'table', spec: ROWS_SPEC });
    stream.push({ type: 'table', spec: EMPTY_SPEC });
    stream.push({ type: 'error', message: 'provider stream failed' });
    stream.end();

    await waitFor(() => expect(screen.getByText('web-01')).toBeInTheDocument());
    expect(screen.queryByText('Results (0 rows)')).not.toBeInTheDocument();
  });
});

describe('ChatPage — confirming before interrupting a running answer', () => {
  function startGeneratingWithSidebar() {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    mockConversationsService.list.mockResolvedValue([
      { id: 'conv-b', title: 'Older conversation', updatedAt: '2024-01-01' },
    ]);
    return stream;
  }

  async function renderAndStartTurn(stream: {
    push: (event: StreamEvent) => void;
  }) {
    renderChatPage();
    await waitFor(() =>
      expect(conversationRow('Older conversation')).toBeInTheDocument(),
    );
    await sendMessage('first question');
    stream.push({ type: 'delta', content: 'half an ans' });
    await waitFor(() =>
      expect(screen.getByText('half an ans')).toBeInTheDocument(),
    );
  }

  it('asks through the platform confirmation, not a modal of its own', async () => {
    const stream = startGeneratingWithSidebar();
    await renderAndStartTurn(stream);

    fireEvent.click(conversationRow('Older conversation'));

    await waitFor(() => expect(mockOpenConfirm).toHaveBeenCalledTimes(1));
    // No styling overrides: the platform's own app-leave confirmation passes none either, and
    // matching it is the point (see services/interrupt-confirm.ts).
    const [message, options] = mockOpenConfirm.mock.calls[0];
    expect(message).toContain('you can retry the question');
    expect(options.title).toBe('A response is still generating');
    expect(options.buttonColor).toBeUndefined();
    expect(options.confirmButtonText).toBeUndefined();
  });

  it('nothing is cancelled until the user answers', async () => {
    const stream = startGeneratingWithSidebar();
    // A confirmation the test never resolves: the decision is still pending.
    mockOpenConfirm.mockReturnValue(new Promise(() => undefined));
    await renderAndStartTurn(stream);
    const signal = lastStreamSignal();

    fireEvent.click(conversationRow('Older conversation'));

    await waitFor(() => expect(mockOpenConfirm).toHaveBeenCalled());
    expect(signal.aborted).toBe(false);
    expect(mockConversationsService.get).not.toHaveBeenCalled();
  });

  it('declining keeps the answer generating in the same conversation', async () => {
    const stream = startGeneratingWithSidebar();
    mockOpenConfirm.mockResolvedValue(false);
    await renderAndStartTurn(stream);
    const signal = lastStreamSignal();

    fireEvent.click(conversationRow('Older conversation'));
    await waitFor(() => expect(mockOpenConfirm).toHaveBeenCalled());

    expect(signal.aborted).toBe(false);
    expect(mockConversationsService.get).not.toHaveBeenCalled();

    // And it really is still live: a later delta still lands in this conversation.
    stream.push({ type: 'delta', content: 'wer, completed' });
    await waitFor(() =>
      expect(screen.getByText('half an answer, completed')).toBeInTheDocument(),
    );
  });

  it('accepting interrupts the turn and opens the other conversation', async () => {
    const stream = startGeneratingWithSidebar();
    await renderAndStartTurn(stream);
    const signal = lastStreamSignal();

    fireEvent.click(conversationRow('Older conversation'));

    await waitFor(() => expect(signal.aborted).toBe(true));
    await waitFor(() =>
      expect(screen.getByText('earlier question')).toBeInTheDocument(),
    );
  });

  it('asks before starting a new conversation while a turn is generating', async () => {
    const stream = startGeneratingWithSidebar();
    mockOpenConfirm.mockResolvedValue(false);
    await renderAndStartTurn(stream);

    // getByRole (not getByText): the conversation header's own "New conversation" fallback
    // title (chat-page.tsx, shown while no conversation is active) can render the exact same
    // string at the same time as this sidebar button.
    fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));

    await waitFor(() => expect(mockOpenConfirm).toHaveBeenCalledTimes(1));
    // Declined, so the turn is untouched.
    expect(screen.getByText('half an ans')).toBeInTheDocument();
  });

  it('does not ask when the clicked conversation is the one already open', async () => {
    const stream = startGeneratingWithSidebar();
    mockConversationsService.get.mockResolvedValue(
      conversationRecord({ id: 'conv-b' }),
    );
    // Open conv-b, then start a turn inside it.
    renderChatPage();
    await waitFor(() =>
      expect(conversationRow('Older conversation')).toBeInTheDocument(),
    );
    fireEvent.click(conversationRow('Older conversation'));
    await waitFor(() =>
      expect(screen.getByText('earlier question')).toBeInTheDocument(),
    );
    await sendMessage('a follow-up');
    stream.push({ type: 'delta', content: 'half an ans' });
    await waitFor(() =>
      expect(screen.getByText('half an ans')).toBeInTheDocument(),
    );
    const signal = lastStreamSignal();
    mockConversationsService.get.mockClear();

    // Clicking the conversation that is already open changes nothing, so there is nothing to
    // interrupt and nothing to confirm.
    fireEvent.click(conversationRow('Older conversation'));

    await waitFor(() =>
      expect(screen.getByText('half an ans')).toBeInTheDocument(),
    );
    expect(mockOpenConfirm).not.toHaveBeenCalled();
    expect(mockConversationsService.get).not.toHaveBeenCalled();
    expect(signal.aborted).toBe(false);
  });

  it('does not ask when nothing is generating', async () => {
    mockConversationsService.list.mockResolvedValue([
      { id: 'conv-b', title: 'Older conversation', updatedAt: '2024-01-01' },
    ]);

    renderChatPage();
    await waitFor(() =>
      expect(conversationRow('Older conversation')).toBeInTheDocument(),
    );

    fireEvent.click(conversationRow('Older conversation'));

    await waitFor(() =>
      expect(screen.getByText('earlier question')).toBeInTheDocument(),
    );
    expect(mockOpenConfirm).not.toHaveBeenCalled();
  });
});

describe('ChatPage — pre-turn Manager session guard (issue #8826)', () => {
  it('ensures the Manager session (60s memo) before the chat stream fires', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('hello');

    expect(mockEnsureManagerSession).toHaveBeenCalledWith(expect.anything(), {
      maxAgeMs: 60_000,
    });
    // The guard must settle before the stream request is issued.
    expect(mockEnsureManagerSession.mock.invocationCallOrder[0]).toBeLessThan(
      mockStreamChat.mock.invocationCallOrder[0],
    );
    stream.end();
  });

  it('does not run the mount-time access-probe heal any more', async () => {
    renderChatPage();
    await waitFor(() =>
      expect(mockSettingsService.getAssistantSettings).toHaveBeenCalled(),
    );
    expect(mockSettingsService.getSettingsAccess).not.toHaveBeenCalled();
  });
});

describe('ChatPage — two-row grid pane (contract §1)', () => {
  /**
   * Regression guard for the composer/welcome overlap bug, and for the over-reservation bug a
   * prior fix for it introduced. A live measurement once caught the sticky composer covering the
   * bottom few pixels of the transcript's last element (a table's pagination bar) even once
   * scrolled all the way down — `position: sticky` reserved the panel's own box in the flow, but
   * not the fade gradient its `::before` painted further upward. The fix replaces that whole
   * mechanism: the pane is now a `display: grid; grid-template-rows: 1fr auto` (`.wzChatPane`,
   * chat-page.scss), so the transcript (`1fr`, scrolling) and the composer (`auto`, in flow) are
   * independent grid rows with no overlap possible by construction — nothing to desync, no
   * gradient, no compensating padding.
   *
   * jsdom never lays out real boxes and does not evaluate the imported `.scss`, so no jsdom test
   * can pin actual pixel values or reproduce the real overlap. What these pin instead is the
   * STRUCTURAL choice the grid rests on.
   */
  it('gives the transcript its own scroll container, independent of the composer', async () => {
    renderChatPage();
    await waitFor(() =>
      expect(
        screen.getByText('Ask the AI Assistant something'),
      ).toBeInTheDocument(),
    );

    // The region named "Chat" IS the transcript now — the single scroll container — not a wrapper
    // that also encloses the composer the way the old sticky-panel layout did.
    const transcript = screen.getByRole('region', { name: 'Chat' });
    expect(transcript.className).toContain('wzChatTranscript');

    // The composer is a SIBLING of the transcript inside `.wzChatPane`, never a descendant of it —
    // that grid-row separation is what makes the old overlap structurally impossible.
    const composerInput = screen.getByLabelText('Chat message');
    expect(transcript.contains(composerInput)).toBe(false);

    // Nothing in the composer's own ancestor chain uses sticky/absolute positioning any more — the
    // grid row boundary is the only thing keeping it in place.
    let node: HTMLElement | null = composerInput;
    while (node) {
      expect(node.style.position).not.toBe('sticky');
      expect(node.style.position).not.toBe('absolute');
      node = node.parentElement;
    }
  });

  it('never sets an inline paddingBottom on the transcript (no JS height measurement)', async () => {
    renderChatPage();
    await waitFor(() =>
      expect(
        screen.getByText('Ask the AI Assistant something'),
      ).toBeInTheDocument(),
    );

    const transcript = screen.getByRole('region', { name: 'Chat' });
    // Any style on this element comes entirely from the `.wzChatTranscript` CSS class
    // (chat-page.scss) — there is no gradient height to reserve space for any more.
    expect(transcript.style.paddingBottom).toBe('');
  });

  it('keeps the composer input reachable once a callout pushes the transcript content down', async () => {
    mockConversationsService.create.mockRejectedValue(httpError(500));
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    // A save-failed callout above the welcome content is exactly the kind of extra height that
    // used to push the composer out of a centered flex box and off screen under the old layout.
    await sendMessage('first question');
    await waitFor(() =>
      expect(
        screen.getByText('This conversation is not being saved'),
      ).toBeInTheDocument(),
    );

    // The composer is still there and not display:none/visibility:hidden'd — it lives in its own
    // grid row, entirely unaffected by how tall the transcript's content grows.
    expect(screen.getByLabelText('Chat message')).toBeVisible();
  });

  /**
   * Returns the body of one top-level SCSS rule, brace-matched so nested rules (`.wzComposerRow` has
   * several) come back with it instead of the block being cut at the first `}`. Used to scope a
   * "this declaration is absent" assertion to the element it is actually about — a file-wide regex
   * cannot tell "the composer is not sticky" from "nothing on this surface is sticky", and the two
   * stopped being the same thing once the status band gained a legitimate `position: sticky`.
   */
  const ruleBlock = (scss: string, selector: string) => {
    const start = scss.indexOf(`${selector} {`);
    if (start === -1) {
      throw new Error(`selector ${selector} not found in stylesheet`);
    }
    let depth = 0;
    for (let i = scss.indexOf('{', start); i < scss.length; i++) {
      if (scss[i] === '{') {
        depth++;
      } else if (scss[i] === '}') {
        depth--;
        if (depth === 0) {
          return scss.slice(start, i + 1);
        }
      }
    }
    throw new Error(`unbalanced braces after ${selector}`);
  };

  it('removes the old sticky/gradient mechanism from the stylesheet entirely', () => {
    // `path.join` against `__dirname` sidesteps Jest's `moduleNameMapper` (which points `.scss`
    // imports at `style_mock.js`) and reads the actual SCSS off disk, the same way the previous
    // version of this test did to pin the mechanism it was checking.
    const scssPath = path.join(__dirname, 'chat-page.scss');
    const scssSource = fs.readFileSync(scssPath, 'utf8');
    // Comments are stripped before matching: this file DOCUMENTS the removed mechanism by name
    // ("there is no `position: sticky` ..."), so asserting against the raw source would fail on the
    // very prose that explains why the rule is gone. Only real declarations are interesting here.
    const scssRules = scssSource
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

    // Scoped to the composer's own rule block rather than the whole file. This used to assert the
    // file contained NO `position: sticky` anywhere, which was a fair proxy while the composer was
    // the only thing that had ever been sticky — but `.wzStatusCallouts` is now legitimately sticky
    // (a status band pinned inside the transcript's scroll container, an entirely different
    // element and mechanism), so the file-wide form would fail on that unrelated rule. What this
    // test actually protects is that the COMPOSER is a flow grid row and not a sticky overlay.
    expect(ruleBlock(scssRules, '.wzComposerRow')).not.toMatch(
      /position:\s*sticky/,
    );
    expect(scssRules).not.toMatch(/wzComposerGradientHeight/);
    expect(scssRules).not.toMatch(/::before/);
    // The replacement mechanism is in place instead: a two-row grid pane, and a shared measure
    // class reading the redesign token rather than restating a pixel figure.
    expect(scssRules).toMatch(/grid-template-rows:\s*1fr auto/);
    expect(scssRules).toMatch(/max-width:\s*\$wzContentMaxWidth/);
  });

  // The band is what keeps a failed turn's explanation on screen in a long conversation. Its
  // placement is the mechanism, not an implementation detail: sticky only travels inside the parent
  // box, so being a child of the wrong element silently reverts the fix with no visual difference on
  // a short conversation, which is exactly where it would be tested by hand.
  it('pins the status band to the transcript scroll container, not to the short content measure', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    mockConversationsService.create.mockRejectedValue(httpError(500));

    renderChatPage();
    await sendMessage('first question');
    await waitFor(() =>
      expect(
        screen.getByText('This conversation is not being saved'),
      ).toBeInTheDocument(),
    );

    const band = document.querySelector('.wzStatusCallouts');
    expect(band).not.toBeNull();
    // Direct child of the full-height flex column, so sticky has the whole scroll height to travel.
    expect(band?.parentElement).toHaveClass('wzTranscriptContent');
    // And NOT inside the content measure, whose box is only as tall as the callouts themselves.
    expect(band?.closest('.wzContentMeasure')).toBeNull();

    const scssRules = fs
      .readFileSync(path.join(__dirname, 'chat-page.scss'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');
    expect(ruleBlock(scssRules, '.wzStatusCallouts')).toMatch(
      /position:\s*sticky/,
    );
  });

  it('leaves no status band in the DOM when there is nothing to report', async () => {
    renderChatPage();
    await screen.findByText('Ask the AI Assistant something');

    // An always-rendered band would paint its opaque ground over the first transcript row.
    expect(document.querySelector('.wzStatusCallouts')).toBeNull();
  });
});

describe('ChatPage — dismissing the error callout', () => {
  // The real failure this reports, verbatim: a provider the assistant could not reach. Delivered as
  // an in-stream `error` event, which is how the generic callout is actually fed (`runChatStream`) —
  // a thrown exception is a different path and never reaches it.
  const PROVIDER_ERROR =
    'Could not reach the provider endpoint. Check the base URL and network access. (fetch failed)';

  it('hides the error callout when dismissed, and shows the same message again on the next failure', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('first question');
    stream.push({ type: 'error', message: PROVIDER_ERROR });
    stream.end();

    await waitFor(() =>
      expect(screen.getByText('Something went wrong')).toBeInTheDocument(),
    );
    expect(screen.getByText(PROVIDER_ERROR)).toBeInTheDocument();

    fireEvent.click(
      document.querySelector(
        '[data-test-subj="wzAiStatusCalloutDismiss"]',
      ) as HTMLElement,
    );
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();

    // Dismissal is per-message, not permanent: the next send clears `error`, which drops the
    // dismissal, so an identical failure is reported again rather than silently swallowed.
    const retry = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => retry.generate(signal),
    );
    await sendMessage('second question');
    retry.push({ type: 'error', message: PROVIDER_ERROR });
    retry.end();

    await waitFor(() =>
      expect(screen.getByText('Something went wrong')).toBeInTheDocument(),
    );
  });

  it('gives the states that are still true after being read no dismiss control', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    mockConversationsService.create.mockRejectedValue(httpError(500));

    renderChatPage();
    await sendMessage('first question');
    await waitFor(() =>
      expect(
        screen.getByText('This conversation is not being saved'),
      ).toBeInTheDocument(),
    );

    // The save-failure notice reports real data-loss risk that dismissing would not resolve, so it
    // deliberately passes no `onDismiss` — no close control anywhere in the band.
    expect(
      document.querySelector('[data-test-subj="wzAiStatusCalloutDismiss"]'),
    ).toBeNull();
  });
});

describe('ChatPage — welcome centers only when there is room (contract §3)', () => {
  it('gives the welcome cluster its own centering box inside the transcript row', async () => {
    renderChatPage();
    const heading = await screen.findByText('Ask the AI Assistant something');

    const welcomeBox = heading.closest('.wzWelcomeCenter');
    expect(welcomeBox).not.toBeNull();
    // The centering box is INSIDE the transcript's own scroll container, never a sibling of it —
    // a short viewport falls back to the transcript's own scroll instead of pushing into the
    // composer, which only holds if the centering box is a descendant, not a peer.
    const transcript = screen.getByRole('region', { name: 'Chat' });
    expect(transcript.contains(welcomeBox)).toBe(true);
  });

  it('groups the example prompts as horizontal cards inside one bordered container (variation 1a)', async () => {
    renderChatPage();
    await screen.findByText('Ask the AI Assistant something');

    // The pill header groups the cards under one container, replacing the old three-cards-with-
    // no-grouping-container layout.
    expect(screen.getByText('Try one of these')).toBeInTheDocument();
    // The full question is now the card's description (no longer truncated to one line), and the
    // title is shown separately — both readable without truncation.
    expect(
      screen.getByText('Show me the critical findings of the last 24 hours'),
    ).toBeInTheDocument();
    expect(screen.getByText('Critical findings')).toBeInTheDocument();
  });
});

describe('ChatPage — sidebar sync across instances (#8827)', () => {
  it('refreshes the conversation list when another instance announces a change', async () => {
    mockConversationsService.list.mockResolvedValue([]);
    renderChatPage();
    await waitFor(() =>
      expect(mockConversationsService.list).toHaveBeenCalledTimes(1),
    );

    // Another mounted ChatPage (e.g. the header flyout) saved a new conversation.
    mockConversationsService.list.mockResolvedValue([
      {
        id: 'conv-flyout',
        title: 'Created in the flyout',
        updatedAt: '2024-01-01',
      },
    ]);
    act(() => {
      window.dispatchEvent(new Event(CONVERSATIONS_CHANGED_EVENT));
    });

    await waitFor(() =>
      expect(screen.getByText('Created in the flyout')).toBeInTheDocument(),
    );
    expect(mockConversationsService.list).toHaveBeenCalledTimes(2);
  });

  it('stops listening once unmounted', async () => {
    mockConversationsService.list.mockResolvedValue([]);
    const { unmount } = renderChatPage();
    await waitFor(() =>
      expect(mockConversationsService.list).toHaveBeenCalledTimes(1),
    );

    unmount();
    window.dispatchEvent(new Event(CONVERSATIONS_CHANGED_EVENT));

    expect(mockConversationsService.list).toHaveBeenCalledTimes(1);
  });
});

/**
 * Rail display mode (layout contract §5/§6): expanded at >=1100px of PANE width, a 48px collapsed
 * strip below that, an `EuiFlyout` below 900px. jsdom has no `ResizeObserver`, and always reports
 * `offsetWidth: 0` — measuring unconditionally against that would collapse the rail into 'flyout'
 * mode in EVERY existing test in this file (all written against an always-expanded rail), so the
 * component only measures when `ResizeObserver` actually exists, and stays 'expanded' otherwise.
 * These tests stub `ResizeObserver` the same way assistant-chat-panel.test.tsx does for its own
 * (unrelated) panel-width responsiveness, to exercise the measuring branch at all.
 */
describe('ChatPage — conversation rail display mode (layout contract §5/§6)', () => {
  function stubResizeObserver(width: number) {
    let triggerResize: (() => void) | undefined;
    class ResizeObserverStub {
      constructor(callback: () => void) {
        triggerResize = callback;
      }
      observe() {}
      disconnect() {}
    }
    const original = (window as unknown as { ResizeObserver?: unknown })
      .ResizeObserver;
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver =
      ResizeObserverStub;
    const widthSpy = jest
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(width);
    return {
      resize: (nextWidth: number) => {
        widthSpy.mockReturnValue(nextWidth);
        triggerResize?.();
      },
      restore: () => {
        widthSpy.mockRestore();
        (window as unknown as { ResizeObserver: unknown }).ResizeObserver =
          original;
      },
    };
  }

  it('stays expanded without ResizeObserver, matching every other test in this file', async () => {
    mockConversationsService.list.mockResolvedValue([
      { id: 'conv-b', title: 'Older conversation', updatedAt: '2024-01-01' },
    ]);
    renderChatPage();
    // The rail is fully rendered inline — a 'flyout' mode here would hide this row behind a
    // button/flyout instead, which every other test in this file assumes never happens.
    await waitFor(() =>
      expect(conversationRow('Older conversation')).toBeInTheDocument(),
    );
  });

  it('collapses the rail to a 48px strip between the flyout and expand thresholds', async () => {
    const stub = stubResizeObserver(1000);
    try {
      mockConversationsService.list.mockResolvedValue([
        { id: 'conv-b', title: 'Older conversation', updatedAt: '2024-01-01' },
      ]);
      renderChatPage();
      const rail = await screen.findByRole('region', {
        name: 'Saved conversations',
      });
      expect(rail.style.width).toBe('48px');
      // The strip is icon-only by design: at this width there is no room for titles, so the rail
      // renders affordances (new conversation, search, expand) and nothing else. Asserting the
      // absence is the point — a strip that still painted 22-character truncated titles would be
      // the "undense rail" the redesign is removing, just narrower.
      expect(screen.queryByText('Older conversation')).toBeNull();
    } finally {
      stub.restore();
    }
  });

  it('moves the rail into an EuiFlyout below the flyout threshold, reachable via its own trigger', async () => {
    const stub = stubResizeObserver(700);
    try {
      mockConversationsService.list.mockResolvedValue([
        { id: 'conv-b', title: 'Older conversation', updatedAt: '2024-01-01' },
      ]);
      renderChatPage();
      // No inline rail region at this width — the conversations list is not directly reachable.
      await waitFor(() =>
        expect(
          screen.queryByRole('region', { name: 'Saved conversations' }),
        ).not.toBeInTheDocument(),
      );

      fireEvent.click(
        screen.getByRole('button', { name: 'Show conversations' }),
      );

      await waitFor(() =>
        expect(screen.getByText('Older conversation')).toBeInTheDocument(),
      );
    } finally {
      stub.restore();
    }
  });

  it('gives the rail flyout its own design-token block, since it renders outside the chat surface', async () => {
    // `EuiFlyout` portals into document.body, so NOTHING in the chat surface's ancestor chain
    // reaches it — including `.wzAiChat`, the element that defines every `--wz-*` custom property.
    // Without a token block of its own the rows' selected/hover pills (`var(--wz-accent-soft)` /
    // `var(--wz-accent-hover)`) failed substitution and computed to transparent, so on a narrow
    // pane the open conversation had no highlight at all and hover did nothing. Same portal trap
    // the provider flyout already carried its own token block for.
    const stub = stubResizeObserver(700);
    try {
      mockConversationsService.list.mockResolvedValue([
        { id: 'conv-b', title: 'Older conversation', updatedAt: '2024-01-01' },
      ]);
      renderChatPage();
      fireEvent.click(
        screen.getByRole('button', { name: 'Show conversations' }),
      );

      await waitFor(() =>
        expect(screen.getByText('Older conversation')).toBeInTheDocument(),
      );
      // Asserted as an ANCESTOR of the rows rather than on the flyout element by name: what the
      // pills need is for the token block to sit somewhere above them in the tree, which is the
      // precise thing portalling broke.
      expect(
        screen.getByText('Older conversation').closest('.wzConvoRailFlyout'),
      ).not.toBeNull();
    } finally {
      stub.restore();
    }
  });

  it('re-expands the rail when the pane grows back past the collapse threshold', async () => {
    const stub = stubResizeObserver(1000);
    try {
      mockConversationsService.list.mockResolvedValue([
        { id: 'conv-b', title: 'Older conversation', updatedAt: '2024-01-01' },
      ]);
      renderChatPage();
      await waitFor(() => {
        const rail = screen.getByRole('region', {
          name: 'Saved conversations',
        });
        expect(rail.style.width).toBe('48px');
      });

      stub.resize(1200);

      await waitFor(() => {
        const rail = screen.getByRole('region', {
          name: 'Saved conversations',
        });
        expect(rail.style.width).toBe('260px');
      });
    } finally {
      stub.restore();
    }
  });

  it('ignores a zero-width measurement instead of collapsing into flyout and wiping a manual override', async () => {
    // A hidden pane (`display: none`) measures 0 — the app shell (application.tsx) keeps ChatPage
    // MOUNTED behind that while the Settings tab is showing, so a Chat<->Settings round-trip used
    // to run the resize callback against a width of 0. Before the fix that flipped the mode to
    // 'flyout' AND cleared `railManualOverrideRef`, so a rail the user had collapsed/expanded by
    // hand silently reverted to the resize-driven default on every trip back from Settings.
    const stub = stubResizeObserver(1000);
    try {
      mockConversationsService.list.mockResolvedValue([
        { id: 'conv-b', title: 'Older conversation', updatedAt: '2024-01-01' },
      ]);
      renderChatPage();
      await waitFor(() => {
        const rail = screen.getByRole('region', {
          name: 'Saved conversations',
        });
        expect(rail.style.width).toBe('48px');
      });

      // Manually expand, at a width that would otherwise default to 'collapsed'.
      fireEvent.click(
        screen.getByRole('button', { name: 'Expand conversation list' }),
      );
      await waitFor(() => {
        const rail = screen.getByRole('region', {
          name: 'Saved conversations',
        });
        expect(rail.style.width).toBe('260px');
      });

      // Pane hidden (e.g. behind the Settings tab): must not change anything.
      stub.resize(0);
      await waitFor(() => {
        const rail = screen.getByRole('region', {
          name: 'Saved conversations',
        });
        expect(rail.style.width).toBe('260px');
      });

      // Pane shown again, still narrow: the manual override is still respected, proving the
      // zero-width tick never wiped it.
      stub.resize(1000);
      await waitFor(() => {
        const rail = screen.getByRole('region', {
          name: 'Saved conversations',
        });
        expect(rail.style.width).toBe('260px');
      });
    } finally {
      stub.restore();
    }
  });
});
