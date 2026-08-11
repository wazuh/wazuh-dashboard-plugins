import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createBrowserHistory } from 'history';
import { ChatPage } from './chat-page';
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
    const [title, messages] =
      mockConversationsService.create.mock.calls[2];
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
      .mockResolvedValueOnce(conversationRecord({ id: 'conv-new', version: 'v1' }));

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

describe('ChatPage — welcome-state layout does not clip the composer', () => {
  /**
   * Regression guard for the composer-clipping bug: the chat pane (the region with `overflowY:
   * 'auto'`, identified by its `aria-label`) must never carry `justifyContent: 'center'` in the
   * welcome state. That combination is what caused the bug — a centered flex box whose content
   * (hero + cards + composer) is taller than the pane distributes the overflow equally above and
   * below, and since `scrollTop` can never go negative, the top half becomes unreachable while the
   * bottom (the composer) renders past the visible edge or mid-content. The pane must stay
   * `flex-start` at all times; any vertical centering happens further down, inside flex-grow
   * spacers that collapse to zero instead of going negative.
   */
  it('never centers the scrollable chat pane itself, even on the welcome screen', async () => {
    renderChatPage();
    await waitFor(() =>
      expect(
        screen.getByText('Ask the AI Assistant something'),
      ).toBeInTheDocument(),
    );

    const pane = screen.getByRole('region', { name: 'Chat' });
    expect(pane.style.justifyContent).not.toBe('center');
    expect(pane.style.overflowY).toBe('auto');
  });

  it('keeps the composer input reachable once a callout pushes the welcome content down', async () => {
    mockConversationsService.create.mockRejectedValue(httpError(500));
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    // A save-failed callout above the welcome content is exactly the kind of extra height that
    // used to push the composer out of the centered flex box and off screen.
    await sendMessage('first question');
    await waitFor(() =>
      expect(
        screen.getByText('This conversation is not being saved'),
      ).toBeInTheDocument(),
    );

    // The composer is still there and not display:none/visibility:hidden'd — the whole point of
    // the fix is that it stays in the DOM's visible flow, with the pane scrolling to reach it
    // rather than the layout clipping it.
    expect(screen.getByLabelText('Chat message')).toBeVisible();
    const pane = screen.getByRole('region', { name: 'Chat' });
    expect(pane.style.justifyContent).not.toBe('center');
  });

  /**
   * Regression guard for the shrink/overlap bug: the welcome column (the pane's direct child) must
   * never be shrinkable (`flex-shrink: 0`, i.e. a flex-basis of `1 0 auto`). A shrinkable column
   * (`1 1 auto`, tried and reverted) let the pane squeeze it below its own content's height once
   * welcome content plus a callout above it overflowed the pane — pushing the cards to render
   * BEHIND the opaque sticky composer instead of the pane scrolling cleanly. A conversation's own
   * column already uses `1 0 auto` for the same reason (see its own comment); the welcome state
   * must match, not diverge.
   */
  it('never lets the welcome column shrink below its own content height', async () => {
    renderChatPage();
    await waitFor(() =>
      expect(
        screen.getByText('Ask the AI Assistant something'),
      ).toBeInTheDocument(),
    );

    const pane = screen.getByRole('region', { name: 'Chat' });
    const column = pane.firstElementChild as HTMLElement;
    expect(column.style.flex).toBe('1 0 auto');
    expect(column.style.minHeight).toBe('0px');
  });
});
