import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
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
const mockHealManagerSession = jest.fn();

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
  healManagerSession: (...args: unknown[]) => mockHealManagerSession(...args),
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

function renderChatPage() {
  const core = {
    http: { basePath: { prepend: (path: string) => path } },
    uiSettings: { get: () => false },
    chrome: { setBreadcrumbs: jest.fn() },
  };

  return render(
    <ChatPage
      core={core as never}
      providers={[PROVIDER]}
      providersLoaded
      providersError={null}
      selectedProviderId={PROVIDER.id}
      onProviderChange={jest.fn()}
      onNavigateToSettings={jest.fn()}
    />,
  );
}

async function sendMessage(text: string) {
  fireEvent.change(screen.getByLabelText('Chat message'), {
    target: { value: text },
  });
  fireEvent.click(screen.getByText('Send'));
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

/** An http error shaped the way `common/http-status.ts` reads a status off an OSD http failure. */
function httpError(status: number): Error & { response: { status: number } } {
  return Object.assign(new Error(`HTTP ${status}`), {
    response: { status },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  window.location.hash = '';
  window.sessionStorage.clear();
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
      expect(screen.getByText('Older conversation')).toBeInTheDocument(),
    );
    await sendMessage('first question');
    stream.push({ type: 'delta', content: 'partial ' });

    const signal = lastStreamSignal();
    expect(signal.aborted).toBe(false);

    fireEvent.click(screen.getByText('Older conversation'));

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
      expect(screen.getByText('Older conversation')).toBeInTheDocument(),
    );
    await sendMessage('first question');
    stream.push({ type: 'delta', content: 'partial answer' });
    await waitFor(() =>
      expect(screen.getByText('partial answer')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText('Older conversation'));

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
      expect(screen.getByText('Older conversation')).toBeInTheDocument(),
    );
    await sendMessage('first question');
    stream.push({ type: 'delta', content: 'partial answer' });
    await waitFor(() =>
      expect(screen.getByText('partial answer')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText('Older conversation'));
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
      expect(screen.getByText('Older conversation')).toBeInTheDocument(),
    );
    await sendMessage('first question');
    expect(screen.getByLabelText('Chat message')).toBeDisabled();

    fireEvent.click(screen.getByText('Older conversation'));

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

    fireEvent.click(screen.getByText('Stop'));

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
    fireEvent.click(screen.getByText('New conversation'));

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
      expect(screen.getByText('Older conversation')).toBeInTheDocument(),
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

    fireEvent.click(screen.getByText('Older conversation'));
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
  it('restores the conversation named by the URL hash on mount', async () => {
    window.location.hash = '#/conversation/conv-b';

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

  it('prefers the URL hash over the stored pointer', async () => {
    window.location.hash = '#/conversation/conv-from-url';
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
    window.location.hash = '#/conversation/conv-gone';
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
    expect(window.location.hash).toBe('#/');
  });

  it('keeps the pointer and reports the failure when the load fails for another reason', async () => {
    window.location.hash = '#/conversation/conv-b';
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
      expect(window.location.hash).toBe('#/conversation/conv-new'),
    );
    expect(
      window.sessionStorage.getItem('wazuhAiAssistant.lastConversation'),
    ).toBe('conv-new');
  });

  it('clears the recorded conversation when the user starts a new one', async () => {
    window.location.hash = '#/conversation/conv-b';

    renderChatPage();
    await waitFor(() =>
      expect(screen.getByText('earlier question')).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByText('New conversation'));

    await waitFor(() => expect(window.location.hash).toBe('#/'));
    expect(
      window.sessionStorage.getItem('wazuhAiAssistant.lastConversation'),
    ).toBeNull();
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
    window.location.hash = '#/conversation/conv-b';

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
    window.location.hash = '#/conversation/conv-b';

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
    window.location.hash = '#/conversation/conv-b';

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
