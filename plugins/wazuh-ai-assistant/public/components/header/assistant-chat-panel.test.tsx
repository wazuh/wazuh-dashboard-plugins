import React from 'react';
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { CoreStart } from '../../../../../src/core/public';
import { ConversationsSnapshot } from '../chat/chat-page';
import { AssistantChatPanel } from './assistant-chat-panel';

const mockNewConversation = jest.fn();
const mockSelectConversation = jest.fn();
const mockDeleteConversation = jest.fn();
const mockRenameConversation = jest.fn();
const mockBulkDeleteConversations = jest.fn();

jest.mock('../chat/chat-page', () => {
  // `jest.mock` factories statically forbid referencing any out-of-scope identifier that isn't a
  // global or prefixed `mock*` (babel-plugin-jest-hoist) — the top-level `React` import fails that
  // check even though it would be safely initialized by the time this factory actually runs. A
  // fresh `require` (a recognized global, not this binding) sidesteps it without needing a
  // `mockReact` alias plumbed through every reference below.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    // `forwardRef` + `useImperativeHandle`, matching the real `ChatPageHandle` contract
    // (assistant-chat-panel.tsx's popover acts on conversations through this ref, since ChatPage —
    // not the panel — owns the actual conversations state) — a plain function component here would
    // silently drop the `ref` the panel passes and every popover interaction test would pass for
    // the wrong reason (nothing ever calling through to it).
    // Named (not an anonymous arrow), so `react/display-name` has a name to report instead of
    // treating this stub like a component DevTools/lint tooling can never identify.
    ChatPage: mockReact.forwardRef(function MockChatPage(
      props: {
        onGeneratingChange?: (generating: boolean) => void;
        onNavigateToSettings: () => void;
        onConversationsChange?: (state: ConversationsSnapshot) => void;
        showConversationSidebar?: boolean;
        allowRailFlyout?: boolean;
        enableWelcomeComposer?: boolean;
      },
      ref: React.Ref<unknown>,
    ) {
      mockReact.useImperativeHandle(ref, () => ({
        newConversation: mockNewConversation,
        selectConversation: mockSelectConversation,
        deleteConversation: mockDeleteConversation,
        // The real `ChatPageHandle` contract also carries these two, and
        // the docked popover (assistant-chat-panel.tsx) calls straight through to them.
        renameConversation: mockRenameConversation,
        bulkDeleteConversations: mockBulkDeleteConversations,
      }));
      return mockReact.createElement(
        'div',
        {
          'data-test-subj': 'chat-page-stub',
          'data-sidebar': String(props.showConversationSidebar),
          'data-allow-rail-flyout': String(props.allowRailFlyout),
          'data-welcome-composer': String(props.enableWelcomeComposer),
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
        mockReact.createElement(
          'button',
          {
            type: 'button',
            onClick: () =>
              props.onConversationsChange?.({
                conversations: [
                  {
                    id: 'c1',
                    title: 'Disconnected agents in production',
                    updatedAt: new Date().toISOString(),
                  },
                ],
                isLoading: false,
                activeConversationId: 'c1',
              }),
          },
          'emit one conversation, active',
        ),
      );
    }),
  };
});

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

function openConversationsPopover() {
  fireEvent.click(screen.getByLabelText('Saved conversations'));
}

/** Scopes a query to the popover panel only — the sidecar header's own subtitle (title feature,
 * assistant-chat-panel.tsx) shows the SAME active conversation title text these tests emit, so an
 * unscoped `getByText`/`findByText` for a conversation's title matches both and throws
 * "Found multiple elements". */
async function getPopoverPanel(): Promise<HTMLElement> {
  const searchField = await screen.findByPlaceholderText(
    'Search conversations',
  );
  return searchField.closest(
    '[role="dialog"], .euiPopover__panel',
  ) as HTMLElement;
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

  it("hides ChatPage's own inline rail — the header's conversations popover is the only way to reach saved conversations from this docked panel", () => {
    renderPanel();

    expect(chatPageStub()).toHaveAttribute('data-sidebar', 'false');
  });

  it('keeps the composer docked in this panel, with no centred welcome state', () => {
    // The centred greeting + composer + cards group and its dock-on-first-send transition are a
    // FULL-PAGE affordance.
    // This sidecar is a narrow column, so it opts out and keeps today's always-docked composer —
    // a separate decision from `allowRailFlyout` above, hence a separate prop.
    renderPanel();

    expect(chatPageStub()).toHaveAttribute('data-welcome-composer', 'false');
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

  it('shows "AI Assistant" plus "Untitled" until a conversation is active, then the active conversation\'s own title', () => {
    renderPanel();

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Untitled')).toBeInTheDocument();

    fireEvent.click(screen.getByText('emit one conversation, active'));

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(
      screen.getByText('Disconnected agents in production'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Untitled')).not.toBeInTheDocument();
  });

  it('opens the saved-conversations popover from the header button and closes it again on a second click', async () => {
    renderPanel();

    expect(
      screen.queryByPlaceholderText('Search conversations'),
    ).not.toBeInTheDocument();

    openConversationsPopover();
    expect(
      await screen.findByPlaceholderText('Search conversations'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Saved conversations'));
    // `EuiPopover` unmounts its panel after its own close transition, not synchronously with the
    // `closePopover` call — `waitFor` is what the rest of this codebase already reaches for here
    // (settings-page.test.tsx's own flyout-close assertions do the same).
    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText('Search conversations'),
      ).not.toBeInTheDocument(),
    );
  });

  it('starts a new conversation via the header shortcut without needing the popover open', () => {
    renderPanel();

    fireEvent.click(screen.getByLabelText('New conversation'));

    expect(mockNewConversation).toHaveBeenCalledTimes(1);
  });

  it("selecting a conversation row inside the popover calls ChatPage's selectConversation and closes the popover", async () => {
    renderPanel();
    fireEvent.click(screen.getByText('emit one conversation, active'));

    openConversationsPopover();
    const popover = await getPopoverPanel();
    fireEvent.click(
      within(popover).getByText('Disconnected agents in production'),
    );

    expect(mockSelectConversation).toHaveBeenCalledWith('c1');
    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText('Search conversations'),
      ).not.toBeInTheDocument(),
    );
  });

  it("deleting a conversation from the popover (through its own confirm modal) calls ChatPage's deleteConversation", async () => {
    renderPanel();
    fireEvent.click(screen.getByText('emit one conversation, active'));

    openConversationsPopover();
    const popover = await getPopoverPanel();

    // The row's actions live behind an overflow menu now; its panel is portaled out of this
    // popover, so the entries are looked up on `screen` rather than within it.
    fireEvent.click(within(popover).getByLabelText('Conversation actions'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete conversation' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(mockDeleteConversation).toHaveBeenCalledWith('c1');
  });

  // This docked popover is a PRIMARY surface for the rail, not a secondary
  // one -- it must get the same rename/bulk-delete affordances the inline rail already has.
  it("renaming a conversation from the popover calls ChatPage's renameConversation", async () => {
    renderPanel();
    fireEvent.click(screen.getByText('emit one conversation, active'));

    openConversationsPopover();
    const popover = await getPopoverPanel();

    fireEvent.click(within(popover).getByLabelText('Conversation actions'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Rename conversation' }),
    );
    const input = within(popover).getByLabelText('Conversation title');
    fireEvent.change(input, { target: { value: 'New title' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockRenameConversation).toHaveBeenCalledWith('c1', 'New title');
  });

  /**
   * Two nested popovers, one Escape. This surface is the only place they stack — the row's overflow
   * menu opens INSIDE the docked conversations popover — so it is where an EUI bump is most likely
   * to break something quietly: an Escape meant for the inner menu dismissing the whole
   * conversations panel and losing the user's place.
   *
   * SCOPE, measured not assumed: only the FIRST half of that is assertable here. This pins that
   * Escape closes the inner menu while nested inside the outer popover — remove
   * `closeRowMenu()` from the row's handler and this fails.
   *
   * The second half — the outer popover surviving — is NOT testable in jsdom, and a test claiming
   * to cover it would be vacuous. Verified by mutation: deleting the `event.stopPropagation()` that
   * protects the outer panel changes nothing here, because `fireEvent.keyDown` does not move focus
   * into the panel, so EUI's outer focus trap never treats the Escape as its own and never begins
   * closing (its `euiPopover__panel-isOpen` class is still set 400ms later, guard or no guard). In a
   * real browser `ownFocus` has moved focus inside, which is exactly the condition jsdom cannot
   * reproduce. That half stays a manual check on the evidence pass: open a conversation's menu in
   * the docked panel, press Escape, confirm the panel is still open behind it.
   */
  it('Escape inside a nested row menu closes that menu', async () => {
    renderPanel();
    fireEvent.click(screen.getByText('emit one conversation, active'));

    openConversationsPopover();
    const popover = await getPopoverPanel();

    const trigger = within(popover).getByLabelText('Conversation actions');
    fireEvent.click(trigger);
    expect(
      await screen.findByRole('button', { name: 'Rename conversation' }),
    ).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'Escape' });

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Rename conversation' }),
      ).toBeNull(),
    );
    // The row itself is untouched by the dismissal — its trigger is still there to reopen.
    expect(
      within(popover).getByLabelText('Conversation actions'),
    ).toBeInTheDocument();
  });

  it("bulk-deleting from the popover calls ChatPage's bulkDeleteConversations", async () => {
    renderPanel();
    fireEvent.click(screen.getByText('emit one conversation, active'));

    openConversationsPopover();
    const popover = await getPopoverPanel();

    fireEvent.click(within(popover).getByLabelText('Select conversations'));
    fireEvent.click(
      within(popover).getByRole('checkbox', {
        name: 'Select "Disconnected agents in production"',
      }),
    );
    fireEvent.click(
      within(popover).getByRole('button', { name: 'Delete (1)' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(mockBulkDeleteConversations).toHaveBeenCalledWith(['c1']);
  });

  it('the popover never repeats the header\'s own "New conversation" button or a "Conversations" title', async () => {
    renderPanel();

    openConversationsPopover();
    await screen.findByPlaceholderText('Search conversations');

    // Exactly one "New conversation" control on screen — the header shortcut — not a second one
    // inside the popover (`showNewConversationButton={false}`, assistant-chat-panel.tsx).
    expect(screen.getAllByLabelText('New conversation')).toHaveLength(1);
    expect(screen.queryByText('Conversations')).not.toBeInTheDocument();
  });
});
