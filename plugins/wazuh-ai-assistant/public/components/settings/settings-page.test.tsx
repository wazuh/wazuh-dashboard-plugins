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

const coreMock = { http: {} } as any;

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

describe('SettingsPage — wazuh_brain hidden from provider type dropdown', () => {
  it('does not include wazuh_brain in the provider type select when the form is open', async () => {
    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    const addButton = await screen.findByRole('button', {
      name: /add provider/i,
    });
    fireEvent.click(addButton);

    // Wait for the form to be visible (Name field is present)
    await screen.findByLabelText(/^name$/i);

    const optionValues = screen
      .getAllByRole('option')
      .map(o => (o as HTMLOptionElement).value);

    expect(optionValues).not.toContain('wazuh_brain');
    expect(optionValues).toContain('openai_compatible');
    expect(optionValues).toContain('anthropic');
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

describe('SettingsPage — auto-probe failures do not become permanent banners', () => {
  it('does not render a page-level callout for a non-default provider the auto-probe failed', async () => {
    mockService.list.mockResolvedValue([
      {
        id: 'p1',
        name: 'My OpenAI',
        type: 'openai_compatible',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        isDefault: false,
      },
    ]);
    mockService.test.mockResolvedValue({
      success: false,
      latencyMs: 0,
      message: 'Connection refused',
    });

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    await waitFor(() => expect(mockService.test).toHaveBeenCalledWith('p1'));
    // The failure must still be visible in the row's status cell (tooltip trigger)...
    expect(await screen.findByText('Connection refused')).toBeInTheDocument();
    // ...but never escalate to a dismissible page-level EuiCallOut, since nobody clicked "Test".
    // Anchored to the callout's own title text rather than the dismiss button's aria-label, which
    // is OUI-internal and not something this test should depend on.
    expect(
      screen.queryByText(/my openai: connection refused/i),
    ).not.toBeInTheDocument();
  });

  it('renders a single dismissible callout when the DEFAULT provider auto-probe fails', async () => {
    mockService.list.mockResolvedValue([
      {
        id: 'p1',
        name: 'My Default',
        type: 'anthropic',
        baseUrl: 'https://api.anthropic.com',
        model: 'claude-3',
        isDefault: true,
      },
    ]);
    mockService.test.mockResolvedValue({
      success: false,
      latencyMs: 0,
      message: 'Invalid API key',
    });

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    await waitFor(() => expect(mockService.test).toHaveBeenCalledWith('p1'));
    expect(
      await screen.findByText(/default provider "my default" is failing/i),
    ).toBeInTheDocument();
  });

  it('renders a dismissible callout for a provider the user manually tested and failed', async () => {
    mockService.list.mockResolvedValue([
      {
        id: 'p1',
        name: 'My OpenAI',
        type: 'openai_compatible',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        isDefault: false,
      },
    ]);
    mockService.test.mockResolvedValue({
      success: false,
      latencyMs: 0,
      message: 'Connection refused',
    });

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    // Wait for the silent auto-probe to finish first — its own failure must not have produced a
    // callout yet.
    await waitFor(() => expect(mockService.test).toHaveBeenCalledWith('p1'));
    expect(
      screen.queryByText(/my openai: connection refused/i),
    ).not.toBeInTheDocument();

    const testButton = await screen.findByRole('button', { name: 'Test' });
    fireEvent.click(testButton);

    await waitFor(() => expect(mockService.test).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText(/my openai: connection refused/i),
    ).toBeInTheDocument();
  });

  it('shows only the default-provider callout, not a duplicate manual one, when the default is manually tested and fails', async () => {
    mockService.list.mockResolvedValue([
      {
        id: 'p1',
        name: 'My Default',
        type: 'anthropic',
        baseUrl: 'https://api.anthropic.com',
        model: 'claude-3',
        isDefault: true,
      },
    ]);
    mockService.test.mockResolvedValue({
      success: false,
      latencyMs: 0,
      message: 'Invalid API key',
    });

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    // Auto-probe already renders the default-provider callout.
    expect(
      await screen.findByText(/default provider "my default" is failing/i),
    ).toBeInTheDocument();

    const testButton = await screen.findByRole('button', { name: 'Test' });
    fireEvent.click(testButton);
    await waitFor(() => expect(mockService.test).toHaveBeenCalledTimes(2));

    // The default-provider callout still renders...
    expect(
      await screen.findByText(/default provider "my default" is failing/i),
    ).toBeInTheDocument();
    // ...but the separate manual-failure callout ("{name}: {message}") must NOT also render for
    // the same provider/message — that would be a duplicate.
    expect(
      screen.queryByText(/^my default: invalid api key$/i),
    ).not.toBeInTheDocument();
  });
});

describe('SettingsPage — manual test failure callout is genuinely dismissible', () => {
  it('renders an explicit close control and clicking it removes the callout', async () => {
    mockService.list.mockResolvedValue([
      {
        id: 'p1',
        name: 'My OpenAI',
        type: 'openai_compatible',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        isDefault: false,
      },
    ]);
    mockService.test.mockResolvedValue({
      success: false,
      latencyMs: 0,
      message: 'Connection refused',
    });

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    // Auto-probe must not have produced the callout yet.
    await waitFor(() => expect(mockService.test).toHaveBeenCalledWith('p1'));

    const testButton = await screen.findByRole('button', { name: 'Test' });
    fireEvent.click(testButton);
    await waitFor(() => expect(mockService.test).toHaveBeenCalledTimes(2));

    expect(
      await screen.findByText(/my openai: connection refused/i),
    ).toBeInTheDocument();

    // The OUI fork's EuiCallOut renders no dismiss control at all for `onDismiss` — the fix must
    // provide an explicit, visible close button instead, not rely on that ignored prop.
    const dismissButton = await screen.findByRole('button', {
      name: 'Dismiss My OpenAI test failure',
    });
    fireEvent.click(dismissButton);

    expect(
      screen.queryByText(/my openai: connection refused/i),
    ).not.toBeInTheDocument();
  });

  it('clears a prior manual failure callout once a later manual test of the same provider succeeds', async () => {
    mockService.list.mockResolvedValue([
      {
        id: 'p1',
        name: 'My OpenAI',
        type: 'openai_compatible',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        isDefault: false,
      },
    ]);
    // Persistent failure so both the auto-probe (call #1) and the manual click (call #2) fail —
    // mockResolvedValueOnce would only cover the auto-probe, leaving the manual click to fall
    // through to the success mock set in beforeEach.
    mockService.test.mockResolvedValue({
      success: false,
      latencyMs: 0,
      message: 'Connection refused',
    });

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    await waitFor(() => expect(mockService.test).toHaveBeenCalledWith('p1'));

    const testButton = await waitFor(() => {
      const button = document.querySelector(
        '[data-test-subj="wz-ai-provider-test-action"]',
      );
      expect(button).not.toBeNull();
      return button as HTMLElement;
    });
    fireEvent.click(testButton);
    await waitFor(() => expect(mockService.test).toHaveBeenCalledTimes(2));

    expect(
      await screen.findByText(/my openai: connection refused/i),
    ).toBeInTheDocument();

    // A later manual test that succeeds must auto-clear the earlier failure callout, without the
    // user needing to dismiss it first.
    mockService.test.mockResolvedValueOnce({
      success: true,
      latencyMs: 42,
      message: null,
    });
    // Re-query via the stable per-row data-test-subj: the primary icon action's accessible name
    // is not a reliable anchor once the failure callout has rendered below the table, so target
    // the action's data-test-subj, which is invariant across re-renders.
    const testButtonAfterFailure = await waitFor(() => {
      const button = document.querySelector(
        '[data-test-subj="wz-ai-provider-test-action"]',
      );
      expect(button).not.toBeNull();
      return button as HTMLElement;
    });
    fireEvent.click(testButtonAfterFailure);
    await waitFor(() => expect(mockService.test).toHaveBeenCalledTimes(3));

    expect(
      screen.queryByText(/my openai: connection refused/i),
    ).not.toBeInTheDocument();
  });

  it('clears a prior manual failure callout once the failing provider is deleted', async () => {
    // Persistent (not Once) so a stray extra `list` call — from this test or a retry — can never
    // leak an unconsumed queued value into a later test via jest.clearAllMocks(), which does not
    // drain mockResolvedValueOnce queues.
    mockService.list.mockResolvedValue([
      {
        id: 'p1',
        name: 'My OpenAI',
        type: 'openai_compatible',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        isDefault: false,
      },
    ]);
    mockService.test.mockResolvedValue({
      success: false,
      latencyMs: 0,
      message: 'Connection refused',
    });

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    await waitFor(() => expect(mockService.test).toHaveBeenCalledWith('p1'));

    const testButton = await screen.findByRole('button', { name: 'Test' });
    fireEvent.click(testButton);
    await waitFor(() => expect(mockService.test).toHaveBeenCalledTimes(2));

    expect(
      await screen.findByText(/my openai: connection refused/i),
    ).toBeInTheDocument();

    // Deleting the provider removes it from the list entirely, so the callout must disappear too.
    mockService.list.mockResolvedValue([]);
    // Test is isPrimary and claims one of the row's two always-visible action slots, so Delete
    // (the second non-primary action, after Edit) collapses behind the row's overflow popover.
    // Open it by its accessible name, not by icon type — EuiBasicTable's CollapsedItemActions
    // trigger is an EuiButtonIcon with iconType "boxesHorizontal" and aria-label "All actions";
    // "boxesVertical" belongs to an unrelated component. Querying by role/name also fails loudly
    // (instead of a silent no-op) if the markup ever changes again.
    const moreRowActionsButton = screen.getByRole('button', {
      name: 'All actions',
    });
    fireEvent.click(moreRowActionsButton);

    // The popover's own context-menu item and the confirm modal's button are both labeled
    // "Delete" — scope to the popover first to trigger the confirm modal.
    const deleteRowButton = await screen.findByRole('button', {
      name: 'Delete',
    });
    fireEvent.click(deleteRowButton);

    // Target the confirm modal's own button via its data-test-subj rather than
    // role='dialog': the OUI fork this repo tests against forked from EUI before
    // EuiModal gained role="dialog", so a role query is unverifiable here — while
    // confirmModalConfirmButton is the selector already proven in this codebase
    // (plugins/main's unsaved-changes-guard tests).
    const confirmDeleteButton = await waitFor(() => {
      const button = document.querySelector(
        '[data-test-subj="confirmModalConfirmButton"]',
      );
      expect(button).not.toBeNull();
      return button as HTMLElement;
    });
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => expect(mockService.remove).toHaveBeenCalledWith('p1'));
    await waitFor(() =>
      expect(
        screen.queryByText(/my openai: connection refused/i),
      ).not.toBeInTheDocument(),
    );
  });
});

describe('SettingsPage — default provider failure callout is genuinely dismissible', () => {
  it('renders an explicit close control and clicking it removes the callout', async () => {
    mockService.list.mockResolvedValue([
      {
        id: 'p1',
        name: 'My Default',
        type: 'anthropic',
        baseUrl: 'https://api.anthropic.com',
        model: 'claude-3',
        isDefault: true,
      },
    ]);
    mockService.test.mockResolvedValue({
      success: false,
      latencyMs: 0,
      message: 'Invalid API key',
    });

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    // Wait for the auto-probe itself before asserting on its callout, so a slow mount doesn't
    // race findByText's own timeout and this test stays independent of prior tests' mock state.
    await waitFor(() => expect(mockService.test).toHaveBeenCalledWith('p1'));
    expect(
      await screen.findByText(/default provider "my default" is failing/i),
    ).toBeInTheDocument();

    const dismissButton = await screen.findByRole('button', {
      name: 'Dismiss default provider failure',
    });
    fireEvent.click(dismissButton);

    expect(
      screen.queryByText(/default provider "my default" is failing/i),
    ).not.toBeInTheDocument();
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
