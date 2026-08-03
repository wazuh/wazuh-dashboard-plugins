import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// SettingsService is instantiated internally — mock the module before importing the component.
const mockService = {
  list: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue(undefined),
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

jest.mock('../../services/session-heal', () => ({
  healManagerSession: jest.fn().mockResolvedValue(false),
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
    mockService.getSettingsAccess.mockResolvedValue({
      administrator: false,
      message: 'Administrator role required to change settings.',
    });

    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getAllByText('Administrator role required to change settings.')
          .length,
      ).toBeGreaterThan(0);
    });
  });
});

describe('SettingsPage — auto-open create-provider flyout (?addProvider=true)', () => {
  it('opens the create form and reports back when autoOpenCreateForm is true', async () => {
    const onDone = jest.fn();

    render(
      <SettingsPage
        core={coreMock}
        onProvidersChanged={jest.fn()}
        autoOpenCreateForm={true}
        onAutoOpenCreateFormDone={onDone}
      />,
    );

    // The create flyout is open (its Name field renders) without clicking "Add provider".
    expect(await screen.findByLabelText(/^name$/i)).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('does not open the form when the flag is absent', async () => {
    render(<SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />);

    await screen.findByRole('button', { name: /add provider/i });
    expect(screen.queryByLabelText(/^name$/i)).not.toBeInTheDocument();
  });
});
