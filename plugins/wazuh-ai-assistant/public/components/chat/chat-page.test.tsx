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
import { ASSISTANT_SETTINGS_CHANGED_EVENT } from '../../services/settings-service';
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
  // Keeps the module's real constants — notably `ASSISTANT_SETTINGS_CHANGED_EVENT`, which the
  // component subscribes to and the tests below dispatch. Stubbing them out would make both sides
  // agree on `undefined` and prove nothing.
  ...jest.requireActual('../../services/settings-service'),
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
    onManageProviders: jest.fn(),
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

  it('replay-leak fix (Fix 3): does NOT resend the restored tool history with the next question', async () => {
    // Was: 'resends the restored tool history with the next question', asserting the OPPOSITE —
    // that a resumed conversation's tool/digest pair WAS resent as history on the next turn. That
    // was a real bug, not a feature: `ToolExchange.digestContent` (common/chat-history.ts) is
    // "already pseudonym-form when privacy was on for that turn", carrying tokens like `HOST_1`
    // minted by a PAST session's `Pseudonymizer`. `applyLoadedConversation` resets the client-held
    // `pseudonymMap` to empty on resume (nothing survives a reload/reopen — the map is wire-only,
    // never persisted), so the server's next `Pseudonymizer` restarts its mint counters at 0 — its
    // very first fresh mint this session is `HOST_1` again, colliding with whatever `HOST_1`
    // already meant in the resent OLD digest content. A model echoing that stale token back would
    // then get it reversed (`StreamDepseudonymizer.reverseText`) to THIS session's real value,
    // silently substituting a different session's real host/IP for the one the stale token
    // actually meant. Fixed in chat-page.tsx's `applyLoadedConversation`: `turnHistoryRef.current`
    // is now cleared (`[]`) on resume instead of being restored from `restored.turnRecords`, so
    // `buildOutgoingMessages` has nothing to resend as a tool/digest pair — this test pins that
    // observably, via the exact same `mockStreamChat` call-args seam the old (now-removed) test
    // used. The resumed conversation is still fully READABLE (`42 alerts` renders, the tool-call
    // chip still shows on the restored turn — see 'shows the executed queries again on a resumed
    // conversation' above): only the ABILITY TO CONTINUE without re-querying is traded for safety.
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
    // The tool pair is history, not a bubble, whether or not it gets resent.
    expect(screen.queryByText('{"count":42}')).not.toBeInTheDocument();

    await sendMessage('and yesterday?');

    // No stale tool/digest pair resent: just the two restored prose messages plus the new one.
    const sentMessages = mockStreamChat.mock
      .calls[0][1] as PersistedChatMessage[];
    expect(sentMessages.map(message => message.role)).toEqual([
      'user',
      'assistant',
      'user',
    ]);
    expect(sentMessages.every(message => !message.toolCalls)).toBe(true);
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
 * events within one turn", and the scenarios below enumerate it exhaustively for the
 * single-table-per-message model — every place an empty `table` event can land relative to a
 * non-empty one, plus the honest-empty cases.
 *
 * The honest-empty cells changed shape with C4 (CEO item 6) and did not go away: a turn whose FINAL
 * table has zero rows still commits that spec (so the saved conversation still says a query ran and
 * matched nothing) but renders no card — the assistant's prose carries the answer, and a turn with
 * no prose gets one quiet subdued line instead. The suppression mechanism this describe covers is
 * unchanged; only what a committed empty spec looks like on screen is.
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

  /**
   * C4 (CEO item 6): the honest-empty case still COMMITS its spec — that is the turn's record of
   * having queried and matched nothing, and it is what gets persisted — but it no longer draws a
   * card: message-bubble.tsx suppresses a 0-row table and, when the turn produced no prose of its
   * own, shows one quiet line in its place. This test used to assert the card ("Results (0 rows)");
   * its premise moved rather than disappeared, so it now pins the replacement end state through the
   * SAME event sequence, keeping this describe's matrix of table-event orderings complete.
   */
  it('shows the quiet no-rows line, not a table card, when the only table this turn is empty and no prose arrived', async () => {
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
      expect(
        screen.getByText('The query returned no rows.'),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText('Results (0 rows)')).not.toBeInTheDocument();
    // EuiBasicTable's stock empty body went with the card that held it.
    expect(screen.queryByText('No items found')).not.toBeInTheDocument();
  });

  it('drops the empty table silently when the turn narrated its own answer', async () => {
    // The common shape of a zero-result turn: the tool returns nothing and the model says so in
    // words. That prose IS the answer (CEO decision: suppress entirely), so neither the card nor the
    // fallback line may appear — the line is the guarantee for a turn with NO prose, never a second
    // answer stapled under one that already has it.
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('top agents?');

    stream.push({ type: 'table', spec: EMPTY_SPEC });
    stream.push({
      type: 'delta',
      content: 'No agents matched that filter in the last 24 hours.',
    });
    stream.push({ type: 'done' });
    stream.end();

    await waitFor(() =>
      expect(
        screen.getByText('No agents matched that filter in the last 24 hours.'),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText('Results (0 rows)')).not.toBeInTheDocument();
    expect(
      screen.queryByText('The query returned no rows.'),
    ).not.toBeInTheDocument();
  });

  it('keeps the executed-query chip reachable on a suppressed empty result', async () => {
    // Provenance normally moves UP into the result card's header (layout contract §4). With the card
    // suppressed there is no header to move it into, so the below-bubble chip has to stay — "what
    // did it actually look for?" is the first question a reader asks of a zero-result answer.
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );

    renderChatPage();
    await sendMessage('top agents?');

    stream.push({
      type: 'tool_call',
      toolCall: { id: 't1', name: 'get_top_agents', arguments: {} },
    });
    stream.push({ type: 'table', spec: EMPTY_SPEC });
    stream.push({ type: 'delta', content: 'Nothing matched.' });
    stream.push({ type: 'done' });
    stream.end();

    await waitFor(() =>
      expect(screen.getByText('Nothing matched.')).toBeInTheDocument(),
    );
    expect(screen.getByText('Top agents · 90d')).toBeInTheDocument();
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
});

/**
 * C2 (ux-iter3): the "jump to latest" affordance that pairs with stick-to-bottom scrolling in every
 * streaming chat UI (ux-research.md §B). The PINNING logic itself is untouched and untested here —
 * jsdom lays out no boxes, so `scrollHeight`/`clientHeight` are 0 and every element reads as pinned;
 * these tests stub those three numbers on the pane so the component's own predicate
 * (`scrollHeight - scrollTop - clientHeight < 160`) resolves to a real answer, and pin the STRUCTURE
 * plus the state transitions around it.
 */
describe('ChatPage — jump to latest (C2)', () => {
  /**
   * Makes the transcript pane read as scrolled up. jsdom hardcodes `scrollTop`/`scrollHeight`/
   * `clientHeight` to 0 and ignores writes to `scrollTop`, so all three are redefined as own
   * properties on the instance; `configurable` so a later call can move the pane back down.
   */
  function stubPaneScroll(
    pane: HTMLElement,
    metrics: { scrollHeight: number; clientHeight: number; scrollTop: number },
  ) {
    Object.entries(metrics).forEach(([name, value]) => {
      Object.defineProperty(pane, name, {
        value,
        writable: true,
        configurable: true,
      });
    });
  }

  function transcriptPane(): HTMLElement {
    return screen.getByRole('region', { name: 'Chat' });
  }

  const jumpButton = () =>
    screen.queryByRole('button', { name: 'Jump to latest' });

  async function renderWithOneTurn() {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    const view = renderChatPage();
    await sendMessage('top agents?');
    stream.push({ type: 'delta', content: 'here they are' });
    await waitFor(() =>
      expect(screen.getByText('here they are')).toBeInTheDocument(),
    );
    return view;
  }

  it('renders nothing while the reader is following the conversation', async () => {
    await renderWithOneTurn();
    expect(jumpButton()).toBeNull();

    // A scroll event that lands INSIDE the 160px pin threshold must not raise the button either —
    // this is the "table render shifted the pane by a few pixels" case the threshold exists for.
    const pane = transcriptPane();
    stubPaneScroll(pane, {
      scrollHeight: 2000,
      clientHeight: 900,
      scrollTop: 1050,
    });
    fireEvent.scroll(pane);
    expect(jumpButton()).toBeNull();
  });

  it('holds its state inside the hysteresis band instead of flickering', async () => {
    // The unpin threshold carries extra slack over the re-pin one (SCROLL_UNPIN_SLACK_PX):
    // a distance between the two must keep whatever state the pane already had, so a layout
    // shift of a few dozen pixels right on the boundary can never toggle the button.
    await renderWithOneTurn();
    const pane = transcriptPane();

    // Pinned, then a scroll landing between 160 and 200 (distance 180): stays pinned.
    stubPaneScroll(pane, {
      scrollHeight: 2000,
      clientHeight: 900,
      scrollTop: 920,
    });
    fireEvent.scroll(pane);
    expect(jumpButton()).toBeNull();

    // Unpin for real (distance 1500), then the same in-band distance: stays UNpinned.
    stubPaneScroll(pane, {
      scrollHeight: 2000,
      clientHeight: 500,
      scrollTop: 0,
    });
    fireEvent.scroll(pane);
    expect(jumpButton()).not.toBeNull();
    stubPaneScroll(pane, {
      scrollHeight: 2000,
      clientHeight: 900,
      scrollTop: 920,
    });
    fireEvent.scroll(pane);
    expect(jumpButton()).not.toBeNull();
  });

  it('appears once the reader scrolls up, outside the pin threshold', async () => {
    await renderWithOneTurn();
    const pane = transcriptPane();
    stubPaneScroll(pane, {
      scrollHeight: 2000,
      clientHeight: 500,
      scrollTop: 0,
    });
    fireEvent.scroll(pane);

    expect(jumpButton()).not.toBeNull();
  });

  it('lives beside the transcript, not inside it and not inside the composer', async () => {
    // Structural, because it is what makes the button behave: a child of the scroll container would
    // scroll away with the content, and the pane-level grid row is what keeps it clear of the
    // composer without any offset tracking the composer's variable height. Same reasoning as the
    // two-row grid tests above — jsdom cannot check the pixels, only the structure they rest on.
    await renderWithOneTurn();
    const pane = transcriptPane();
    stubPaneScroll(pane, {
      scrollHeight: 2000,
      clientHeight: 500,
      scrollTop: 0,
    });
    fireEvent.scroll(pane);

    const button = jumpButton() as HTMLElement;
    expect(pane.contains(button)).toBe(false);
    expect(button.closest('.wzJumpToLatest')).not.toBeNull();
    // Same grid parent as the transcript (`.wzChatPane`), so `grid-row: 1` can put it back into the
    // transcript's own row.
    expect(button.closest('.wzChatPane')).toBe(pane.parentElement);
    expect(button.closest('.wzComposerRow')).toBeNull();
  });

  it('shares the transcript grid CELL explicitly, so appearing moves nothing on either axis', () => {
    // Two bugs in sequence pin this shape (css-audit-full.md §3.2 and the re-audit's §3.1):
    // with NEITHER item placed, the button pushed the composer into an implicit third ROW
    // (36px vertical shove); with only `grid-row: 1` on both, the button's auto COLUMN created
    // an implicit 40px second column instead — the surface narrowed 40px and every message
    // shifted 20px left when it appeared. The invariant that matters is that transcript and
    // button share the full CELL (grid-area 1/1) inside an explicit single-column grid.
    //
    // jsdom lays out no grid, so the mechanism is pinned where it lives: all three declarations
    // must be present, because any one missing is a broken state we have already shipped once.
    const scssRules = fs
      .readFileSync(path.join(__dirname, 'chat-page.scss'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

    expect(scssRules).toMatch(
      /\.wzChatPane \{[^}]*grid-template-columns:\s*1fr/,
    );
    expect(scssRules).toMatch(/\.wzChatTranscript \{[^}]*grid-area:\s*1 \/ 1/);
    expect(scssRules).toMatch(/\.wzJumpToLatest \{[^}]*grid-area:\s*1 \/ 1/);
    // Centred over the measure, not parked in the row's inline-end corner — and with no
    // inline-end margin left over from the corner placement (§3.2).
    expect(scssRules).toMatch(/\.wzJumpToLatest \{[^}]*justify-self:\s*center/);
    expect(scssRules).not.toMatch(
      /margin-inline-end:\s*\$wzScrollGutter \+ 24px/,
    );
  });

  it('scrolls to the newest content and re-pins when clicked', async () => {
    await renderWithOneTurn();
    const pane = transcriptPane();
    stubPaneScroll(pane, {
      scrollHeight: 2000,
      clientHeight: 500,
      scrollTop: 0,
    });
    // `Element.prototype.scrollTo` is not implemented in jsdom, so the component feature-detects it
    // and falls back to a direct `scrollTop` assignment (which jsdom ignores). Supplying the mock is
    // what makes the smooth path observable at all.
    const scrollTo = jest.fn();
    Object.defineProperty(pane, 'scrollTo', {
      value: scrollTo,
      writable: true,
      configurable: true,
    });
    fireEvent.scroll(pane);

    fireEvent.click(jumpButton() as HTMLElement);

    expect(scrollTo).toHaveBeenCalledWith({ top: 2000, behavior: 'smooth' });
    // Re-pinned: the button removes itself immediately on click rather than waiting for the smooth
    // scroll's own trailing scroll event, so it can never be left floating over a pinned transcript.
    expect(jumpButton()).toBeNull();
  });

  it('re-pins on send, so a new turn never leaves the button on screen', async () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    renderChatPage();
    await sendMessage('first question');
    const pane = transcriptPane();
    stubPaneScroll(pane, {
      scrollHeight: 2000,
      clientHeight: 500,
      scrollTop: 0,
    });
    fireEvent.scroll(pane);
    expect(jumpButton()).not.toBeNull();

    stream.push({ type: 'done' });
    stream.end();
    // The composer swaps Send for Stop while a turn generates, so waiting for Send to come back is
    // also how this waits for the first turn to have finished.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument(),
    );
    await sendMessage('second question');

    // `startTurn` force-repins (the one case where overriding the reader's scroll position is what
    // they expect), and the button's own mirror follows it through `repinToBottom`.
    expect(jumpButton()).toBeNull();
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

  it('offers the example prompts as horizontal cards, with no wrapper panel and no pill header', async () => {
    renderChatPage();
    await screen.findByText('Ask the AI Assistant something');

    // The full question is the card's description and the short title is shown separately — both
    // readable, neither truncated.
    expect(
      screen.getByText('Critical findings in the last 24 hours'),
    ).toBeInTheDocument();
    const title = screen.getByText('Critical findings');
    expect(title).toBeInTheDocument();

    // The grouping container and the "Try one of these" pill that used to head it are BOTH gone
    // (css-audit-full.md §1.2/§1.3): the outer EuiPanel had the identical border, radius and fill as
    // the cards inside it — a card-in-a-card carrying no information — and the pill was a third
    // instructional line under a title and subtitle that already say what to do.
    expect(screen.queryByText('Try one of these')).toBeNull();
    const grid = title.closest('.wzExampleCardsGrid') as HTMLElement;
    expect(grid).not.toBeNull();
    // The grid's own parent is the plain welcome column, not a panel wrapped around the cards. The
    // cards themselves are still bordered EuiPanels — that is what groups them now.
    expect(grid.parentElement?.className).toContain('wzWelcomeCenter');
    expect(grid.closest('.euiPanel')).toBeNull();
    // ...and each card carries the shared container radius rather than EuiCard's own 4px (§6).
    expect(title.closest('.euiCard')).toHaveClass('wzWelcomeCard');
  });
});

/**
 * C1 (ux-iter3, AI/ux-iter3/gemini-motion-spec.md): the Gemini-style empty state — greeting,
 * example cards and composer as ONE vertically centred group — and the one-time transition that
 * docks the composer on the first send.
 *
 * jsdom runs no transitions and lays out no boxes, so what these pin is the STATE MACHINE and the
 * structure it drives (which classes exist in which state, what is in flow when the first message
 * lands, and both settle paths), exactly as the two-row-grid tests above pin the grid's structure
 * rather than its pixels. Every measured delta is 0 here — `getBoundingClientRect` returns zeros —
 * which is why the inverted transform below is asserted as `translateY(0px)`: the value is the
 * environment's, the fact that the mechanism ran is the point.
 */
describe('ChatPage — welcome composer and first-send transition (C1)', () => {
  const chatPane = () => document.querySelector('.wzChatPane') as HTMLElement;
  const composerRow = () =>
    document.querySelector('.wzComposerRow') as HTMLElement;
  const welcomeGroup = () =>
    document.querySelector('.wzWelcomeCenter') as HTMLElement | null;

  /** Presses Send WITHOUT awaiting the turn: the docking frame is set up synchronously inside the
   * click, and the assertions about it have to run before anything else is flushed. */
  function pressSend(text: string) {
    fireEvent.change(screen.getByLabelText('Chat message'), {
      target: { value: text },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  }

  function stubStream() {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId, _messages, signal: AbortSignal) => stream.generate(signal),
    );
    return stream;
  }

  /**
   * Dispatches a real `transitionend`, built by hand. `fireEvent.transitionEnd(el, {propertyName})`
   * cannot be used: jsdom implements no `TransitionEvent` constructor, so dom-testing-library falls
   * back to plain `Event`, which silently drops unknown init fields — and `propertyName` is exactly
   * what the component filters on, so the settle would never be reached.
   */
  function fireTransitionEnd(element: HTMLElement, propertyName: string) {
    const event = new Event('transitionend', { bubbles: true });
    Object.defineProperty(event, 'propertyName', { value: propertyName });
    fireEvent(element, event);
  }

  it('centres the greeting, the cards and the composer as one group', async () => {
    renderChatPage();
    await screen.findByText('Ask the AI Assistant something');

    // The pane itself is the centring container, which is what makes the cluster and the composer
    // ONE group without the composer leaving its own grid row / DOM position.
    expect(chatPane().className).toBe('wzChatPane wzChatPane--welcome');
    const input = screen.getByLabelText('Chat message');
    expect(chatPane().contains(input)).toBe(true);
    expect(chatPane().contains(welcomeGroup())).toBe(true);
    // The compact centred measure hangs off this class (chat-page.scss); the shared measure class
    // stays on the same element, so the docked width needs no second element to fall back to.
    const measure = input.closest('.wzComposerMeasure');
    expect(measure).not.toBeNull();
    expect(measure?.classList.contains('wzContentMeasure')).toBe(true);
    // Nothing may be wedged between the cluster and the composer: `grid-row: 1` means nothing in a
    // flex column, so the jump button is withheld until there is a conversation to jump to.
    expect(screen.queryByRole('button', { name: 'Jump to latest' })).toBeNull();
  });

  it('never centres in the embedded docked panel', async () => {
    // assistant-chat-panel.tsx passes exactly this: the sidecar keeps today's always-docked
    // composer, with no centred state and no transition to run in a 600px column.
    renderChatPage({ enableWelcomeComposer: false });
    await screen.findByText('Ask the AI Assistant something');

    expect(chatPane().className).toBe('wzChatPane');
    // The welcome content itself is unchanged there — only the composer's position is.
    expect(welcomeGroup()?.className).toBe('wzWelcomeCenter');
    expect(
      screen.getByText('Critical findings in the last 24 hours'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Chat message')).toBeVisible();
  });

  // Iteration-4 item 1 (option A): the two-row composer floor is scoped to the full-page surface
  // via `.wzComposerRow--roomy`, derived from the same `enableWelcomeComposer` prop this describe
  // block already uses to distinguish the full-page surface from the header's docked sidecar.
  it('marks the composer row roomy on the full-page surface only', async () => {
    renderChatPage();
    await screen.findByText('Ask the AI Assistant something');
    expect(composerRow().classList.contains('wzComposerRow--roomy')).toBe(true);
  });

  it('never marks the composer row roomy in the embedded docked panel', async () => {
    renderChatPage({ enableWelcomeComposer: false });
    await screen.findByText('Ask the AI Assistant something');
    expect(composerRow().classList.contains('wzComposerRow--roomy')).toBe(
      false,
    );
  });

  // Iteration-4 item 1 (option C): greeting, example cards and composer all narrow to the same
  // 840px cluster width under `.wzChatPane--welcome`, via `.wzWelcomeMeasure` and
  // `.wzComposerMeasure` specifically — NOT the bare `.wzContentMeasure` those two also carry,
  // which the sticky status-callout band's own measure carries too with no welcome-specific class
  // of its own; an unscoped rule on the bare class would narrow that band right along with the
  // welcome cluster.
  it('caps the welcome cluster width via .wzWelcomeMeasure/.wzComposerMeasure, not the bare .wzContentMeasure', () => {
    const scssPath = path.join(__dirname, 'chat-page.scss');
    const scssSource = fs
      .readFileSync(scssPath, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    expect(scssSource).toMatch(
      /\.wzChatPane--welcome \.wzWelcomeMeasure,\s*\n\s*\.wzChatPane--welcome \.wzComposerMeasure\s*\{\s*max-width:\s*\$wzWelcomeGroupMaxWidth;/,
    );
    expect(scssSource).not.toMatch(
      /\.wzChatPane--welcome \.wzContentMeasure\s*\{/,
    );
  });

  it('renders the welcome cluster with .wzWelcomeMeasure, not just the bare .wzContentMeasure the status band also carries', async () => {
    renderChatPage();
    await screen.findByText('Ask the AI Assistant something');

    const measure = welcomeGroup()?.closest('.wzContentMeasure');
    expect(measure?.classList.contains('wzWelcomeMeasure')).toBe(true);
  });

  it('animates the composer measure open on dock, but keeps the welcome measure pinned at 840px through the same bridge', () => {
    const scssPath = path.join(__dirname, 'chat-page.scss');
    const scssSource = fs
      .readFileSync(scssPath, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '');
    // The composer's OWN measure is the one that tweens the cap open — no scoping to a pane state,
    // so the transition is armed regardless of which class swap (`--welcome` leaving or
    // `--docking` arriving) actually changes the computed max-width.
    expect(scssSource).toMatch(
      /\.wzComposerMeasure\s*\{\s*transition:\s*max-width \$wzDockTravel \$wzDockEase;/,
    );
    // The welcome cluster's own measure ancestor — the containing block its `--leaving` ghost
    // fades against — stays pinned at the SAME cap through the docking bridge instead, so the
    // ghost's box never resizes out from under it mid-fade.
    expect(scssSource).toMatch(
      /\.wzChatPane--docking \.wzWelcomeMeasure\s*\{\s*max-width:\s*\$wzWelcomeGroupMaxWidth;/,
    );
  });

  it('moves through docking and settles docked on the first send', async () => {
    const stream = stubStream();
    renderChatPage();
    await screen.findByText('Ask the AI Assistant something');

    pressSend('first question');

    // The bridge is entered in the same click that sends, before any await — the composer's final
    // (docked) layout is committed immediately and the travel is the inverted transform below.
    expect(chatPane().className).toBe('wzChatPane wzChatPane--docking');
    expect(composerRow().style.transform).toBe('translateY(0px)');
    // Inverted with transitions OFF, so the jump back to the old position is instant; the next
    // animation frame releases both and `.wzChatPane--docking`'s own transition takes over.
    expect(composerRow().style.transition).toBe('none');

    // The fading cluster is out of flow (`--leaving`) and no longer stretches the measure box, so
    // the transcript is already laid out at its final height when the user's message lands in it.
    const leaving = welcomeGroup() as HTMLElement;
    expect(leaving.className).toContain('wzWelcomeCenter--leaving');
    expect(leaving.closest('.wzContentMeasure')?.className).not.toContain(
      'wzContentMeasure--stretch',
    );

    await waitFor(() => expect(mockStreamChat).toHaveBeenCalled());
    expect(screen.getByText('first question')).toBeInTheDocument();

    // Fast settle path: the row's own transform transition finishing.
    fireTransitionEnd(composerRow(), 'transform');

    // Byte-identical end state: the bare docked pane, no modifier and no leftover inline styles.
    expect(chatPane().className).toBe('wzChatPane');
    expect(composerRow().style.transform).toBe('');
    expect(composerRow().style.transition).toBe('');
    expect(welcomeGroup()).toBeNull();
    stream.end();
  });

  it('ignores a nested transition and settles on the timer instead', async () => {
    const stream = stubStream();
    renderChatPage();
    await screen.findByText('Ask the AI Assistant something');

    pressSend('first question');

    // A descendant's own transition (an EUI button hover, the textarea's height) bubbles to the same
    // handler and must not end the travel early. Fired synchronously, before anything is awaited, so
    // this can never race the fallback timer below.
    fireTransitionEnd(screen.getByLabelText('Chat message'), 'height');
    expect(chatPane().className).toBe('wzChatPane wzChatPane--docking');
    await waitFor(() => expect(mockStreamChat).toHaveBeenCalled());

    // Real timers, not fake ones: the fallback timer is the PRIMARY settle path (a browser can
    // swallow `transitionend`, and jsdom never fires one on its own), so this waits it out for real
    // rather than mocking away the very mechanism under test.
    await waitFor(() => expect(chatPane().className).toBe('wzChatPane'), {
      timeout: 3000,
    });
    expect(composerRow().style.transform).toBe('');
    stream.end();
  });

  it('hard-cuts to the docked layout under prefers-reduced-motion', async () => {
    const original = window.matchMedia;
    // Only the reduced-motion query answers `true`, and the returned object carries the whole
    // MediaQueryList surface: EUI's own responsive helpers call `matchMedia` too, and a bare
    // `{ matches }` stub would throw the moment one of them attached a listener.
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
      writable: true,
      configurable: true,
    });
    try {
      const stream = stubStream();
      renderChatPage();
      await screen.findByText('Ask the AI Assistant something');
      expect(chatPane().className).toBe('wzChatPane wzChatPane--welcome');

      pressSend('first question');

      // No `docking` frame at all: no travel, no ghost, no inline transform — the composer is
      // simply where it will stay.
      expect(chatPane().className).toBe('wzChatPane');
      expect(composerRow().style.transform).toBe('');
      expect(welcomeGroup()?.className).not.toContain('--leaving');
      await waitFor(() => expect(mockStreamChat).toHaveBeenCalled());
      stream.end();
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        value: original,
        writable: true,
        configurable: true,
      });
    }
  });

  it('starts docked, with no transition, for a conversation restored on mount', async () => {
    window.history.replaceState(null, '', '/conversation/conv-b');

    renderChatPage();
    await waitFor(() =>
      expect(screen.getByText('earlier question')).toBeInTheDocument(),
    );

    // A restored conversation has messages, so it never passes through the centred state and has no
    // bridge to animate — `docked` is the machine's initial value precisely for this case.
    expect(chatPane().className).toBe('wzChatPane');
    expect(welcomeGroup()).toBeNull();
    expect(composerRow().style.transform).toBe('');
  });

  it('returns to the centred welcome after New conversation', async () => {
    const stream = stubStream();
    renderChatPage();
    await screen.findByText('Ask the AI Assistant something');
    await sendMessage('first question');
    stream.push({ type: 'done' });
    stream.end();
    // Send coming back is how the composer reports the turn has finished.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));

    // The transition is once per conversation, not once per session: an empty transcript is offered
    // the centred composer again. Waited for, because a still-settling bridge owns the machine
    // until its own settle lands.
    await waitFor(
      () => expect(chatPane().className).toBe('wzChatPane wzChatPane--welcome'),
      { timeout: 3000 },
    );
    expect(
      screen.getByText('Ask the AI Assistant something'),
    ).toBeInTheDocument();
  });

  it('keeps the centred state and the travel in the stylesheet, not in JS', () => {
    // Same reasoning (and same `path.join`/`fs` route around `moduleNameMapper`) as the
    // two-row-grid stylesheet test above: the mechanism lives in CSS, so the CSS is what gets
    // pinned.
    const scssPath = path.join(__dirname, 'chat-page.scss');
    const scssRules = fs
      .readFileSync(scssPath, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '');

    // The centred state is a flex column that centres the pair.
    expect(scssRules).toMatch(/\.wzChatPane--welcome\s*\{/);
    expect(scssRules).toMatch(/justify-content:\s*center/);
    // The composer has NO measure of its own DISTINCT from the shared one any more — it shares
    // `.wzContentMeasure`'s system (via `.wzComposerMeasure`) in both states, which is what gives
    // the empty state a single alignment edge (css-audit-full.md §1.1). The OLD 680px-pill
    // mechanism (a private `$wzWelcomeComposerMaxWidth`, a width tween between two DIFFERENT pill
    // widths) is pinned as absent — a silently-restored 680px pill would be exactly that
    // regression. A `max-width` transition on `.wzComposerMeasure` DOES legitimately exist now,
    // though (assertion below): it interpolates the shared measure's OWN two caps, 840px centred
    // vs 1060px docked, which is a different mechanism from the removed pill and is covered by its
    // own SCSS test above ('animates the composer measure open on dock...').
    expect(scssRules).not.toMatch(/\$wzWelcomeComposerMaxWidth/);
    expect(scssRules).toMatch(
      /\.wzComposerMeasure\s*\{\s*transition:\s*max-width \$wzDockTravel \$wzDockEase;/,
    );
    // What the class carries instead: the composer's own BLOCK gutter (8px, 16px block-start in
    // the centred state so greeting → cards → composer are one evenly-spaced group — §1.5). The
    // 24px INLINE half moved to `.wzComposerRow` instead (live-audit follow-up, item 3): keeping
    // it on `.wzComposerMeasure` shrank the visible panel to 840 - 2×24 = 792px while the welcome
    // cluster's own padding-less measure reached the full 840, a 48px edge mismatch the two
    // shared-measure elements must not have.
    expect(scssRules).toMatch(
      /\.wzComposerMeasure\s*\{\s*padding-block:\s*8px/,
    );
    expect(scssRules).not.toMatch(
      /\.wzComposerMeasure\s*\{\s*padding:\s*8px 24px/,
    );
    expect(scssRules).toMatch(
      /\.wzChatPane--welcome \.wzComposerMeasure\s*\{\s*padding-block-start:\s*16px/,
    );
    expect(scssRules).toMatch(
      /\.wzComposerRow\s*\{[\s\S]*?padding-inline:\s*24px/,
    );
    // The travel is a transform transition on the composer row, and the fading cluster leaves the
    // flow instead of pushing the incoming message down.
    expect(scssRules).toMatch(
      /\.wzChatPane--docking > \.wzComposerRow \{\s*transition: transform/,
    );
    expect(scssRules).toMatch(
      /\.wzWelcomeCenter--leaving \{[\s\S]*?position: absolute/,
    );
    // Motion stays opt-in: the travel/fade declarations live inside a reduced-motion block, so a
    // reduced-motion user gets the layout without any of it.
    expect(scssRules).toMatch(
      /@media \(prefers-reduced-motion: no-preference\)/,
    );
    expect(scssRules).toMatch(/animation: wzFadeOut/);
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

  /**
   * `railDisplayModeOverride` (the docked header panel's own toolbar toggle — assistant-chat-
   * panel.tsx has no other way to reach ConversationList's inline collapse/expand controls) forces
   * the mode the same way ConversationList's own affordances already do, going through the SAME
   * `railManualOverrideRef` — so it wins over whatever the width alone would pick, and (below
   * RAIL_FLYOUT_AT with `allowRailFlyout={false}`, the sidecar's own band) SURVIVES a later resize
   * that lands in the same band, instead of being silently wiped back to 'collapsed'.
   */
  it('forces the rail expanded via railDisplayModeOverride even under the collapse threshold', async () => {
    const stub = stubResizeObserver(1000);
    try {
      renderChatPage({ railDisplayModeOverride: 'expanded' });
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

  it('forces the rail collapsed via railDisplayModeOverride even above the expand threshold', async () => {
    const stub = stubResizeObserver(1200);
    try {
      renderChatPage({ railDisplayModeOverride: 'collapsed' });
      await waitFor(() => {
        const rail = screen.getByRole('region', {
          name: 'Saved conversations',
        });
        expect(rail.style.width).toBe('48px');
      });
    } finally {
      stub.restore();
    }
  });

  it('keeps an expanded override alive across a resize inside the docked panel band (allowRailFlyout=false)', async () => {
    // The docked sidecar's own default width (assistant-chat-panel.tsx) sits well under
    // RAIL_FLYOUT_AT — exactly the band that used to force 'collapsed' and wipe any override on
    // every resize tick, which would have silently undone the panel's own toolbar toggle the
    // moment the user dragged the sidecar to a new (still narrow) width.
    const stub = stubResizeObserver(500);
    try {
      const view = renderChatPage({
        allowRailFlyout: false,
        railDisplayModeOverride: 'expanded',
      });
      await waitFor(() => {
        const rail = screen.getByRole('region', {
          name: 'Saved conversations',
        });
        expect(rail.style.width).toBe('260px');
      });

      stub.resize(600);
      await waitFor(() => {
        const rail = screen.getByRole('region', {
          name: 'Saved conversations',
        });
        expect(rail.style.width).toBe('260px');
      });

      view.rerenderWith({
        allowRailFlyout: false,
        railDisplayModeOverride: 'collapsed',
      });
      await waitFor(() => {
        const rail = screen.getByRole('region', {
          name: 'Saved conversations',
        });
        expect(rail.style.width).toBe('48px');
      });
    } finally {
      stub.restore();
    }
  });
});

// Iteration-4 item 2: the composer's provider control is now `ProviderPicker` (provider-picker.tsx)
// rather than an inline `EuiSelect` — these pin the wiring at the ChatPage level (the picker's own
// popover/selection/manage-providers behaviour is covered by provider-picker.test.tsx).
describe('ChatPage — provider picker wiring', () => {
  it('renders the picker instead of a raw <select>, and its trigger shows the provider name', async () => {
    renderChatPage();
    await screen.findByLabelText('Chat message');
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(
      screen.getByRole('button', { name: /Test provider/i }),
    ).toBeInTheDocument();
  });

  it('routes provider selection through the same onProviderChange handler as before', async () => {
    const onProviderChange = jest.fn();
    const secondProvider = { ...PROVIDER, id: 'p2', name: 'Second provider' };
    renderChatPage({
      providers: [PROVIDER, secondProvider],
      onProviderChange,
    });
    await screen.findByLabelText('Chat message');

    fireEvent.click(screen.getByRole('button', { name: /Test provider/i }));
    fireEvent.click(screen.getByText('Second provider'));

    expect(onProviderChange).toHaveBeenCalledWith('p2');
  });

  it('calls the dedicated onManageProviders callback, not onNavigateToSettings', async () => {
    const onManageProviders = jest.fn();
    const onNavigateToSettings = jest.fn();
    renderChatPage({ onManageProviders, onNavigateToSettings });
    await screen.findByLabelText('Chat message');

    fireEvent.click(screen.getByRole('button', { name: /Test provider/i }));
    fireEvent.click(screen.getByText('Manage providers'));

    expect(onManageProviders).toHaveBeenCalledTimes(1);
    expect(onNavigateToSettings).not.toHaveBeenCalled();
  });
});

// This codebase's element-lookup convention is `data-test-subj` (37 uses across the plugin), not
// React Testing Library's own `data-testid` — the component below wires up `data-test-subj`, so
// these two helpers query DOM directly instead of `findByTestId`/`findAllByTestId`, which look for
// the wrong attribute and would never resolve.
function findPrivacyChip(): Promise<HTMLElement> {
  return waitFor(() => {
    const el = document.querySelector('[data-test-subj="wzPrivacyChip"]');
    expect(el).not.toBeNull();
    return el as HTMLElement;
  });
}

// Each test in this describe block mounts a SECOND, separate ChatPage instance (via a fresh
// `renderChatPage()` call rather than `rerenderWith`) without unmounting the first, to exercise a
// brand-new component picking up a changed settings mock — so both chips coexist in `document`
// once the second instance's own settings fetch resolves. Selecting by the modifier class the
// second mount is expected to land on (rather than "whichever chip appeared last") avoids a race
// where `waitFor` resolves on the FIRST mount's still-present, stale-state chip before the second
// mount's own async fetch has finished and re-rendered its badge.
function findPrivacyChipWithModifier(
  modifier: 'on' | 'off',
): Promise<HTMLElement> {
  return waitFor(() => {
    const el = document.querySelector(
      `[data-test-subj="wzPrivacyChip"].wzPrivacyChip--${modifier}`,
    );
    expect(el).not.toBeNull();
    return el as HTMLElement;
  });
}

describe('ChatPage — composer privacy chip (iteration 4)', () => {
  it('renders as a single wzPrivacyChip badge carrying the --off/--on modifier for the current setting', async () => {
    renderChatPage();
    const offChip = await findPrivacyChip();
    expect(offChip).toHaveClass('wzPrivacyChip--off');
    expect(offChip).not.toHaveClass('wzPrivacyChip--on');

    mockSettingsService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: true,
      privacyDefaultPerProvider: {},
      userCanOverride: true,
      conversationRetentionDays: 0,
    });
    renderChatPage();
    const onChip = await findPrivacyChipWithModifier('on');
    expect(onChip).toHaveClass('wzPrivacyChip--on');
    expect(onChip).not.toHaveClass('wzPrivacyChip--off');
  });

  it('toggles privacy on click when the admin left it overridable, and is not clickable when fixed', async () => {
    renderChatPage();
    const chip = await findPrivacyChip();
    // A clickable EuiBadge renders its outer element as a <button> (onClick/onClickAriaLabel are
    // spread onto it); a non-clickable one renders a plain <span> — asserting the tag name is the
    // same "is this actually clickable" check a screen-reader/keyboard user relies on.
    expect(chip.tagName).toBe('BUTTON');

    fireEvent.click(chip);
    await waitFor(() => expect(chip).toHaveClass('wzPrivacyChip--on'));

    mockSettingsService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      privacyDefaultPerProvider: {},
      userCanOverride: false,
      conversationRetentionDays: 0,
    });
    renderChatPage();
    // The first chip was just clicked to `--on` above, so `--off` can only match the SECOND
    // mount's own chip — no risk of picking up the first mount's stale element here.
    const fixedChip = await findPrivacyChipWithModifier('off');
    expect(fixedChip.tagName).not.toBe('BUTTON');

    fireEvent.click(fixedChip);
    expect(fixedChip).toHaveClass('wzPrivacyChip--off');
  });
});

// The full explainer used to live in an EuiToolTip WRAPPING the pill itself, which meant hovering
// the pill to click it also forced a wall of text. It now lives on a separate, discrete ⓘ
// (EuiIconTip) placed right after the pill — this only needs to prove that affordance exists;
// the pill's own click/toggle behavior is already covered by the describe block above.
describe('ChatPage — privacy explainer moved off the pill onto a discrete ⓘ (iteration-4 batch 2 item 1)', () => {
  it('renders a discrete info affordance beside the pill, separate from the pill itself', async () => {
    renderChatPage();
    const chip = await findPrivacyChip();

    const infoTip = screen.getByLabelText(/about privacy mode/i);
    expect(infoTip).toBeInTheDocument();
    expect(infoTip).not.toBe(chip);
  });
});

/**
 * Admin privacy policy changes have to reach an ALREADY-MOUNTED chat. Both views stay mounted
 * behind `display: none` (application.tsx), so the mount-only settings load held a stale policy
 * until a full page reload. The Settings page now dispatches
 * `ASSISTANT_SETTINGS_CHANGED_EVENT` after every successful save, and the chat also refetches when
 * it becomes visible again.
 */
describe('ChatPage — admin privacy policy applies without a reload', () => {
  /** Every case here mounts the full ChatPage and then drives two or three settings round-trips
   * through it. That is comfortably under Jest's 5s default in isolation, but the whole suite runs
   * `--runInBand` alongside 99 others and the slowest observed full-gate run took roughly twice as
   * long per render, which tipped these over. Explicit headroom instead of a global bump, so a
   * genuinely hung test still fails rather than stalling the gate. */
  const PRIVACY_POLICY_TEST_TIMEOUT_MS = 30_000;
  /**
   * Scoped through jest.setTimeout rather than a per-test third argument, which Prettier expands
   * into a far noisier shape.
   *
   * Jest exposes no public getter for the configured test timeout, so the previous budget is read
   * off the jasmine global (present under the jasmine2 runner, which is what the platform's Jest
   * config uses) and restored afterwards. Nothing is hardcoded: if that global is ever absent the
   * raised budget simply stays in effect, which is harmless because this is the LAST describe in
   * the file — keep it last, or capture and restore explicitly.
   */
  const jasmineGlobal = () =>
    (globalThis as { jasmine?: { DEFAULT_TIMEOUT_INTERVAL?: number } }).jasmine;
  let previousTimeout: number | undefined;
  beforeEach(() => {
    previousTimeout = jasmineGlobal()?.DEFAULT_TIMEOUT_INTERVAL;
    jest.setTimeout(PRIVACY_POLICY_TEST_TIMEOUT_MS);
  });
  afterEach(() => {
    if (typeof previousTimeout === 'number') {
      jest.setTimeout(previousTimeout);
    }
  });

  const settings = (overrides: Record<string, unknown>) => ({
    privacyDefaultOn: false,
    privacyDefaultPerProvider: {},
    userCanOverride: true,
    conversationRetentionDays: 0,
    ...overrides,
  });

  /** A save announced WITHOUT a payload, so the listener has to fall back to its own GET. */
  const announceSettingsSaved = () =>
    act(() => {
      window.dispatchEvent(new Event(ASSISTANT_SETTINGS_CHANGED_EVENT));
    });

  /** A save announced the way settings-page.tsx really does it: the document the PUT returned
   * travels as `detail`, so no GET is needed (and a GET could still see the pre-save doc). */
  const announceSettingsSavedWith = (detail: unknown) =>
    act(() => {
      window.dispatchEvent(
        new CustomEvent(ASSISTANT_SETTINGS_CHANGED_EVENT, { detail }),
      );
    });

  /** Drives `document.visibilityState`, which jsdom exposes as a read-only getter, then fires the
   * event the component listens for. Restored to 'visible' after each case below. */
  const setDocumentVisibility = (state: 'visible' | 'hidden') => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => state,
    });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
  };

  afterEach(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });

  /** A stream that opens and stays open, so a turn reaches `streamChat` and parks there — enough
   * for the send-path assertions below, which only care about the request body. */
  const mockOpenStream = () => {
    const stream = createControllableStream();
    mockStreamChat.mockImplementation(
      (_providerId: unknown, _messages: unknown, signal: AbortSignal) =>
        stream.generate(signal),
    );
    return stream;
  };

  it('locks the chip — and overrides the user own toggle — when the admin revokes overrides', async () => {
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true, privacyDefaultOn: false }),
    );
    renderChatPage();
    const offChip = await findPrivacyChipWithModifier('off');
    expect(offChip.tagName).toBe('BUTTON');

    // The user makes their own choice, which normally freezes the default resolution.
    fireEvent.click(offChip);
    await findPrivacyChipWithModifier('on');

    // The admin now revokes overrides with the global default OFF. The lock has to bind the
    // CURRENT conversation too, so the user's manual "On" must not survive it.
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: false, privacyDefaultOn: false }),
    );
    announceSettingsSaved();

    const lockedChip = await findPrivacyChipWithModifier('off');
    expect(lockedChip.tagName).not.toBe('BUTTON');
    expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(2);
  });

  it('applies a newly locked-ON policy to the live conversation', async () => {
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true, privacyDefaultOn: false }),
    );
    renderChatPage();
    await findPrivacyChipWithModifier('off');

    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: false, privacyDefaultOn: true }),
    );
    announceSettingsSaved();

    const chip = await findPrivacyChipWithModifier('on');
    expect(chip.tagName).not.toBe('BUTTON');
  });

  it('re-enables the chip when the admin gives overrides back (the unlock case)', async () => {
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: false, privacyDefaultOn: true }),
    );
    renderChatPage();
    const lockedChip = await findPrivacyChipWithModifier('on');
    expect(lockedChip.tagName).not.toBe('BUTTON');

    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true, privacyDefaultOn: true }),
    );
    announceSettingsSaved();

    // The modifier class stays `--on` through this transition (only clickability changes), so a
    // plain class-selector wait can resolve on the stale, still-`--on` SPAN from before the
    // refetch — wait for the tag itself to actually flip to BUTTON.
    const chip = await waitFor(() => {
      const el = document.querySelector(
        '[data-test-subj="wzPrivacyChip"].wzPrivacyChip--on',
      ) as HTMLElement;
      expect(el).not.toBeNull();
      expect(el.tagName).toBe('BUTTON');
      return el;
    });
    // And it is genuinely interactive again, not just visually enabled.
    fireEvent.click(chip);
    await findPrivacyChipWithModifier('off');
  });

  it('leaves a user-chosen value alone while overrides stay allowed', async () => {
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true, privacyDefaultOn: false }),
    );
    renderChatPage();
    const offChip = await findPrivacyChipWithModifier('off');

    fireEvent.click(offChip);
    await findPrivacyChipWithModifier('on');

    // An unrelated admin save (still allowing overrides) must not undo the user's own choice.
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true, privacyDefaultOn: false }),
    );
    announceSettingsSaved();

    await waitFor(() =>
      expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(2),
    );
    const chip = await findPrivacyChipWithModifier('on');
    expect(chip.tagName).toBe('BUTTON');
  });

  it('refetches when the Chat view becomes visible again, and not on the first render', async () => {
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true }),
    );
    const view = renderChatPage({ isActive: true });
    await waitFor(() =>
      expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(1),
    );

    // Switching to Settings and back: only the false -> true transition refetches.
    view.rerenderWith({ isActive: false });
    expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(1);

    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: false, privacyDefaultOn: true }),
    );
    view.rerenderWith({ isActive: true });

    await waitFor(() =>
      expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(2),
    );
    const chip = await findPrivacyChipWithModifier('on');
    expect(chip.tagName).not.toBe('BUTTON');
  });

  it('stops listening once unmounted', async () => {
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true }),
    );
    const { unmount } = renderChatPage();
    await waitFor(() =>
      expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(1),
    );

    unmount();
    window.dispatchEvent(new Event(ASSISTANT_SETTINGS_CHANGED_EVENT));

    expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(1);
  });

  it('keeps the applied policy when the refetch fails', async () => {
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: false, privacyDefaultOn: true }),
    );
    renderChatPage();
    const chip = await findPrivacyChipWithModifier('on');
    expect(chip.tagName).not.toBe('BUTTON');

    mockSettingsService.getAssistantSettings.mockRejectedValue(httpError(503));
    announceSettingsSaved();

    await waitFor(() =>
      expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(2),
    );
    const chipAfter = await findPrivacyChipWithModifier('on');
    expect(chipAfter.tagName).not.toBe('BUTTON');
  });
  it('applies the event payload directly, without re-reading the settings', async () => {
    // M4 read-after-write: a GET issued microseconds after the PUT can still return the PRE-save
    // document, which would silently reinstate the policy the admin just changed. The payload the
    // Settings page attaches is authoritative, so no second GET may happen at all.
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true, privacyDefaultOn: false }),
    );
    renderChatPage();
    const offChip = await findPrivacyChipWithModifier('off');
    expect(offChip.tagName).toBe('BUTTON');

    // Deliberately leave the GET returning the STALE document: if the listener re-read, the chip
    // would stay unlocked and this test would fail.
    announceSettingsSavedWith(
      settings({ userCanOverride: false, privacyDefaultOn: true }),
    );

    const chip = await findPrivacyChipWithModifier('on');
    expect(chip.tagName).not.toBe('BUTTON');
    expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(1);
  });

  it('falls back to a GET when the event payload is missing or malformed', async () => {
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true, privacyDefaultOn: false }),
    );
    renderChatPage();
    await findPrivacyChipWithModifier('off');

    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: false, privacyDefaultOn: true }),
    );
    // A shape that must NOT be trusted as a settings document.
    announceSettingsSavedWith({ nonsense: true });

    await waitFor(() =>
      expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(2),
    );
    const chip = await findPrivacyChipWithModifier('on');
    expect(chip.tagName).not.toBe('BUTTON');
  });

  it('refetches when the document becomes visible again', async () => {
    // H1(b): an admin saving in a DIFFERENT browser reaches no window event here, so an idle chat
    // left open would keep honouring a stale policy. Coming back to the tab has to correct it.
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true, privacyDefaultOn: false }),
    );
    renderChatPage();
    await findPrivacyChipWithModifier('off');

    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: false, privacyDefaultOn: true }),
    );
    setDocumentVisibility('hidden');
    setDocumentVisibility('visible');

    await waitFor(() =>
      expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(2),
    );
    const chip = await findPrivacyChipWithModifier('on');
    expect(chip.tagName).not.toBe('BUTTON');
  });

  it('does not refetch when the document merely becomes hidden', async () => {
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true }),
    );
    renderChatPage();
    await waitFor(() =>
      expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(1),
    );

    setDocumentVisibility('hidden');

    expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(1);
  });

  it('stops listening to visibility changes once unmounted', async () => {
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true }),
    );
    const { unmount } = renderChatPage();
    await waitFor(() =>
      expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(1),
    );

    unmount();
    setDocumentVisibility('hidden');
    setDocumentVisibility('visible');

    expect(mockSettingsService.getAssistantSettings).toHaveBeenCalledTimes(1);
  });

  it('re-reads the policy before sending, and sends what the server will enforce', async () => {
    // H1(a) — the headline gap. A user on a different machine sees no window event at all, so at
    // the moment it actually matters (pressing Send) the policy is re-read and the request body is
    // built from THAT, not from a chip that may be minutes stale.
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true, privacyDefaultOn: false }),
    );
    mockOpenStream();
    renderChatPage();
    await findPrivacyChipWithModifier('off');

    // An admin elsewhere locks privacy ON. Nothing in this browser knows yet.
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: false, privacyDefaultOn: true }),
    );

    await sendMessage('what happened last night?');

    // The privacy payload is the 4th argument of streamChat.
    expect(mockStreamChat.mock.calls[0][3]).toEqual({ enabled: true, map: [] });
    // ...and the chip now tells the truth too.
    const chip = await findPrivacyChipWithModifier('on');
    expect(chip.tagName).not.toBe('BUTTON');
  });

  it('still sends when the pre-send policy re-read fails', async () => {
    // Fail-soft is load-bearing: a failing settings GET must never block the user from sending.
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true, privacyDefaultOn: true }),
    );
    mockOpenStream();
    renderChatPage();
    await findPrivacyChipWithModifier('on');

    mockSettingsService.getAssistantSettings.mockRejectedValue(httpError(503));

    await sendMessage('still works?');

    expect(mockStreamChat).toHaveBeenCalled();
    // The policy already in state is kept — never silently downgraded to "off", which is the
    // direction that would leak.
    expect(mockStreamChat.mock.calls[0][3]).toEqual({ enabled: true, map: [] });
  });

  it('keeps a user-chosen privacy value through the pre-send re-read', async () => {
    mockSettingsService.getAssistantSettings.mockResolvedValue(
      settings({ userCanOverride: true, privacyDefaultOn: false }),
    );
    mockOpenStream();
    renderChatPage();
    const offChip = await findPrivacyChipWithModifier('off');

    // The user turns privacy on for this conversation; overrides stay allowed server-side.
    fireEvent.click(offChip);
    await findPrivacyChipWithModifier('on');

    await sendMessage('respect my choice');

    expect(mockStreamChat.mock.calls[0][3]).toEqual({ enabled: true, map: [] });
  });
});
