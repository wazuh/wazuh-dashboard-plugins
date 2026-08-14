import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// SettingsService is instantiated internally — mock the module before importing the component.
const mockService = {
  list: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  test: jest
    .fn()
    .mockResolvedValue({ success: true, latencyMs: 50, message: null }),
  setDefault: jest.fn().mockResolvedValue(undefined),
  getAssistantSettings: jest.fn().mockResolvedValue({
    privacyDefaultOn: false,
    userCanOverride: true,
    fieldPolicy: [],
    conversationRetentionDays: 0,
  }),
  getSettingsAccess: jest
    .fn()
    .mockResolvedValue({ administrator: true, message: null }),
  updateAssistantSettings: jest.fn().mockResolvedValue({}),
};

jest.mock('../../services/settings-service', () => ({
  SettingsService: jest.fn(() => mockService),
}));

// The page derives canSave/accessMessage/apiKeyEncryptionEnabled from ensureManagerSession's
// resolved value now (the probe→heal→re-probe choreography lives in the service, tested there).
const mockEnsureManagerSession = jest.fn();

jest.mock('../../services/session-heal', () => ({
  ensureManagerSession: (...args: unknown[]) =>
    mockEnsureManagerSession(...args),
}));

import { SettingsPage } from './settings-page';
import { CoreStart } from '../../../../../src/core/public';

const coreMock = { http: {} } as unknown as CoreStart;

beforeEach(() => {
  jest.clearAllMocks();
  mockService.list.mockResolvedValue([]);
  mockService.getAssistantSettings.mockResolvedValue({
    privacyDefaultOn: false,
    userCanOverride: true,
    fieldPolicy: [],
    conversationRetentionDays: 0,
  });
  mockService.getSettingsAccess.mockResolvedValue({
    administrator: true,
    message: null,
  });
  mockEnsureManagerSession.mockResolvedValue({
    administrator: true,
    message: null,
    defaultApiHostId: 'default',
    apiKeyEncryptionEnabled: true,
  });
  mockService.test.mockResolvedValue({
    success: true,
    latencyMs: 50,
    message: null,
  });
});

describe('SettingsPage — wazuh_brain hidden from provider type choices', () => {
  it('does not offer wazuh_brain among the provider type cards when the form is open', async () => {
    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    const addButton = await screen.findByRole('button', {
      name: /add provider/i,
    });
    fireEvent.click(addButton);

    // Wait for the form to be visible (Name field is present)
    await screen.findByLabelText(/^name/i);

    // Provider type (screen 4, variation 4a) is now two EuiCheckableCard radios instead of a
    // <select>/<option> pair — assert on those directly rather than on <option> elements.
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    // The label is the type name alone now; the list of services it covers moved down into the
    // card's own description, which had the room for it (provider-form-flyout.tsx).
    expect(screen.getByLabelText(/openai-compatible/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/anthropic \(claude\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/wazuh_brain/i)).not.toBeInTheDocument();
  });
});

describe('SettingsPage — auto-test on load', () => {
  it('calls service.test for each provider immediately after loading', async () => {
    mockService.list.mockResolvedValue([
      {
        id: 'p1',
        name: 'My OpenAI',
        type: 'openai_compatible',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        isDefault: true,
      },
    ]);

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    await waitFor(() => {
      expect(mockService.test).toHaveBeenCalledWith('p1');
    });
  });

  it('does not call service.test when there are no providers', async () => {
    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    await waitFor(() => expect(mockService.list).toHaveBeenCalled());
    expect(mockService.test).not.toHaveBeenCalled();
  });
});

describe('SettingsPage — Test all tests only the filtered set, throttled', () => {
  const threeProviders = [
    {
      id: 'p1',
      name: 'Alpha',
      type: 'openai_compatible',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
      isDefault: true,
    },
    {
      id: 'p2',
      name: 'Beta',
      type: 'openai_compatible',
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'llama3.3',
      isDefault: false,
    },
    {
      id: 'p3',
      name: 'Gamma-matched',
      type: 'anthropic',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-opus-4-8',
      isDefault: false,
    },
  ];

  it('only re-tests the providers the "Filter providers" box is currently showing', async () => {
    mockService.list.mockResolvedValue(threeProviders);

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    // Let the silent auto-probe (one call per loaded provider) finish before clearing, so it
    // cannot be mistaken for "Test all"'s own calls below.
    await waitFor(() => expect(mockService.test).toHaveBeenCalledTimes(3));
    mockService.test.mockClear();

    fireEvent.change(screen.getByPlaceholderText(/filter providers/i), {
      target: { value: 'matched' },
    });
    fireEvent.click(screen.getByRole('button', { name: /test all/i }));

    await waitFor(() => expect(mockService.test).toHaveBeenCalledWith('p3'));
    expect(mockService.test).not.toHaveBeenCalledWith('p1');
    expect(mockService.test).not.toHaveBeenCalledWith('p2');
  });

  it('disables "Test all" while its own run is in flight, then re-enables it', async () => {
    mockService.list.mockResolvedValue(threeProviders);
    // A single shared pending promise: every `service.test` call (auto-probe and "Test all"
    // alike) resolves together on one explicit `resolveAll` call below, keeping the button
    // reliably disabled until then regardless of how many probes are in flight.
    let resolveAll: (value: {
      success: boolean;
      latencyMs: number;
      message: null;
    }) => void = () => {};
    const pending = new Promise<{
      success: boolean;
      latencyMs: number;
      message: null;
    }>(resolve => {
      resolveAll = resolve;
    });
    mockService.test.mockImplementation(() => pending);

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    const testAllButton = await screen.findByRole('button', {
      name: /test all/i,
    });
    fireEvent.click(testAllButton);

    await waitFor(() => expect(testAllButton).toBeDisabled());

    resolveAll({ success: true, latencyMs: 12, message: null });

    await waitFor(() => expect(testAllButton).toBeEnabled());
  });
});

describe('SettingsPage — field policy filter', () => {
  it('shows filter input and hides non-matching fields', async () => {
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      fieldPolicy: [
        { field: 'agent.name', action: 'allow' },
        { field: 'source.ip', action: 'anonymize' },
      ],
      conversationRetentionDays: 0,
    });

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    const filterInput = await screen.findByPlaceholderText(/filter fields/i);
    expect(filterInput).toBeInTheDocument();

    expect(await screen.findByDisplayValue('agent.name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('source.ip')).toBeInTheDocument();

    fireEvent.change(filterInput, { target: { value: 'agent' } });

    expect(screen.getByDisplayValue('agent.name')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('source.ip')).not.toBeInTheDocument();
  });
});

describe('SettingsPage — RBAC tooltip on disabled Save buttons', () => {
  it('renders the access message when the user is not an administrator', async () => {
    mockEnsureManagerSession.mockResolvedValue({
      administrator: false,
      message: 'Administrator role required to change settings.',
      defaultApiHostId: 'default',
      apiKeyEncryptionEnabled: true,
    });

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getAllByText('Administrator role required to change settings.')
          .length,
      ).toBeGreaterThan(0);
    });
  });

  it('fails open (no callout, saving not blocked) when the access probe itself fails', async () => {
    mockEnsureManagerSession.mockResolvedValue(null);

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    await waitFor(() => expect(mockEnsureManagerSession).toHaveBeenCalled());
    expect(
      screen.queryByText(/administrator role required/i),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: /add provider/i }),
    ).toBeEnabled();
  });
});

describe('SettingsPage — auto-open create-provider flyout (?addProvider=true)', () => {
  it('opens the create form and reports it open when autoOpenCreateForm is true', async () => {
    const onOpenChange = jest.fn();

    render(
      <SettingsPage
        core={coreMock}
        onProvidersChanged={jest.fn()}
        autoOpenCreateForm={true}
        onCreateFormOpenChange={onOpenChange}
      />,
    );

    // The create flyout is open (its Name field renders) without clicking "Add provider".
    expect(await screen.findByLabelText(/^name\s*\*?$/i)).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('does not open the form when the flag is absent', async () => {
    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    await screen.findByRole('button', { name: /add provider/i });
    expect(screen.queryByLabelText(/^name\s*\*?$/i)).not.toBeInTheDocument();
  });

  // RC2 (issue #8827 review): the URL only ever reflected a deep link INTO the create flow —
  // opening the same flyout from the page's own "Add provider" button left `?addProvider=true`
  // out of the address bar entirely, so the state wasn't shareable/bookmarkable/refresh-safe.
  it('reports the create form open when "Add provider" is clicked directly, not only via the URL flag', async () => {
    const onOpenChange = jest.fn();

    render(
      <SettingsPage
        core={coreMock}
        onProvidersChanged={jest.fn()}
        onCreateFormOpenChange={onOpenChange}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', { name: /add provider/i }),
    );

    expect(await screen.findByLabelText(/^name\s*\*?$/i)).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('reports the create form closed once the flyout is dismissed', async () => {
    const onOpenChange = jest.fn();

    render(
      <SettingsPage
        core={coreMock}
        onProvidersChanged={jest.fn()}
        autoOpenCreateForm={true}
        onCreateFormOpenChange={onOpenChange}
      />,
    );

    await screen.findByLabelText(/^name\s*\*?$/i);
    onOpenChange.mockClear();

    fireEvent.click(
      document.querySelector(
        '[data-test-subj="euiFlyoutCloseButton"]',
      ) as Element,
    );

    await waitFor(() =>
      expect(screen.queryByLabelText(/^name\s*\*?$/i)).not.toBeInTheDocument(),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not report a URL change when the EDIT (not create) flyout opens or closes', async () => {
    mockService.list.mockResolvedValue([
      {
        id: 'p1',
        name: 'My OpenAI',
        type: 'openai_compatible',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        isDefault: true,
      },
    ]);
    const onOpenChange = jest.fn();

    render(
      <SettingsPage
        core={coreMock}
        onProvidersChanged={jest.fn()}
        onCreateFormOpenChange={onOpenChange}
      />,
    );

    // Row actions are a single ⋯ popover (screen 3: "Row actions become EuiPopover +
    // EuiContextMenu") rather than EUI's own collapsed "All actions" button.
    fireEvent.click(
      await screen.findByRole('button', { name: 'Actions for My OpenAI' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(await screen.findByLabelText(/^name\s*\*?$/i)).toBeInTheDocument();

    fireEvent.click(
      document.querySelector(
        '[data-test-subj="euiFlyoutCloseButton"]',
      ) as Element,
    );
    await waitFor(() =>
      expect(screen.queryByLabelText(/^name\s*\*?$/i)).not.toBeInTheDocument(),
    );

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe('SettingsPage — the hidden tab must not keep a flyout on screen', () => {
  it('does not render the provider flyout while the Chat tab is the visible one', async () => {
    // The page stays mounted behind `display: none` so it keeps its state, but EuiFlyout portals to
    // document.body where no ancestor's `display: none` can reach it — so the flyout floated over
    // the chat surface after switching tabs with it open.
    const { rerender } = render(
      <SettingsPage
        core={coreMock}
        onProvidersChanged={jest.fn()}
        autoOpenCreateForm={true}
      />,
    );
    expect(await screen.findByLabelText(/^name\s*\*?$/i)).toBeInTheDocument();

    rerender(
      <SettingsPage
        core={coreMock}
        onProvidersChanged={jest.fn()}
        autoOpenCreateForm={true}
        isActive={false}
      />,
    );

    expect(screen.queryByLabelText(/^name\s*\*?$/i)).toBeNull();
  });
});
