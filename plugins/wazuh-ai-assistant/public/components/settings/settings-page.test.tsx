import path from 'path';
import fs from 'fs';
import React from 'react';
import { MemoryRouter, Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
  within,
} from '@testing-library/react';
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
    privacyDefaultPerProvider: {},
    fieldPolicy: [],
    conversationRetentionDays: 0,
  }),
  getSettingsAccess: jest.fn().mockResolvedValue({
    managerSessionOk: true,
    message: null,
    defaultApiHostId: 'default',
    apiKeyEncryptionEnabled: true,
  }),
  // Echoes its argument back (rather than an unconditional `{}`) so a test can assert what a
  // save round-trip left `loadedAssistantSettings`/the draft holding, and so a SECOND save in the
  // same test sees the first save's own payload as its starting point instead of an empty stub.
  updateAssistantSettings: jest
    .fn()
    .mockImplementation(payload => Promise.resolve(payload)),
};

jest.mock('../../services/settings-service', () => ({
  // Keeps the module's real constants — `ASSISTANT_SETTINGS_CHANGED_EVENT` and
  // `PROVIDERS_CHANGED_EVENT`, which this page dispatches and the tests below listen for. Stubbing
  // them out would make both sides agree on `undefined` and prove nothing.
  ...jest.requireActual('../../services/settings-service'),
  SettingsService: jest.fn(() => mockService),
}));

jest.mock('../../plugin-services', () => ({
  getWazuhCore: jest.fn().mockReturnValue({
    utils: {
      webDocumentationLink: (urlPath: string) =>
        `https://documentation.wazuh.com/5.0/${urlPath}`,
    },
  }),
}));

import { SettingsPage, parseRetentionDays } from './settings-page';
import {
  ASSISTANT_SETTINGS_CHANGED_EVENT,
  PROVIDERS_CHANGED_EVENT,
} from '../../services/settings-service';
import { CoreStart } from '../../../../../src/core/public';

const coreMock = { http: {} } as unknown as CoreStart;

/**
 * `SettingsPage` reads the active tab off the URL via `useLocation`/`useHistory`, which requires
 * an ambient `<Router>` — in the real app that's application.tsx's own
 * `<Router history={history}>`, which this page is always rendered under. `initialEntries`
 * defaults to the bare settings path (no `?tab=`), i.e. the Providers tab, matching every
 * pre-existing test's assumption below unless a test overrides it to reach another tab.
 */
const SettingsPageWithRouter: React.FC<
  React.ComponentProps<typeof SettingsPage> & { initialEntries?: string[] }
> = ({ initialEntries = ['/settings'], ...props }) => (
  <MemoryRouter initialEntries={initialEntries}>
    <SettingsPage {...props} />
  </MemoryRouter>
);

/**
 * One provider fixture and one `core` carrying toast spies, shared by every case below rather
 * than redeclared per describe. The global `beforeEach`'s `jest.clearAllMocks()` resets the
 * spies between cases, so no per-describe reset is needed.
 */
const PROVIDER = {
  id: 'p1',
  name: 'My OpenAI',
  type: 'openai_compatible',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  isDefault: false,
};

const toasts = { addSuccess: jest.fn(), addDanger: jest.fn() };

const coreWithToasts = {
  http: {},
  notifications: { toasts },
} as unknown as CoreStart;

/**
 * Drives the "My OpenAI" row's menu Delete action through its confirmation modal. The modal's
 * confirm button is reached by its own `data-test-subj` rather than by role+name: the row menu's
 * "Delete" item is also a button named "Delete", and whether EUI has finished unmounting the
 * popover by the time the modal renders is a race — querying by name hits both and fails
 * intermittently ("Found multiple elements with the role button and name /^delete$/i").
 */
async function deleteProviderThroughRowMenu(): Promise<void> {
  fireEvent.click(
    await screen.findByRole('button', { name: /actions for my openai/i }),
  );
  fireEvent.click(await screen.findByText(/^delete$/i));
  const confirmButton = await waitFor(() => {
    const button = document.querySelector(
      '[data-test-subj="confirmModalConfirmButton"]',
    );
    if (!button) {
      throw new Error('delete confirmation modal not open');
    }
    return button;
  });
  fireEvent.click(confirmButton);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockService.list.mockResolvedValue([]);
  mockService.getAssistantSettings.mockResolvedValue({
    privacyDefaultOn: false,
    userCanOverride: true,
    privacyDefaultPerProvider: {},
    fieldPolicy: [],
    conversationRetentionDays: 0,
  });
  mockService.getSettingsAccess.mockResolvedValue({
    managerSessionOk: true,
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

describe('SettingsPage — documentation link', () => {
  it('links to the AI assistant section of the dashboard configuration docs', async () => {
    render(
      <SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />,
    );

    const link = await screen.findByRole('link', { name: /documentation/i });
    expect(link).toHaveAttribute(
      'href',
      'https://documentation.wazuh.com/5.0/user-manual/wazuh-dashboard/wazuh-dashboard-configurations.html#ai-assistant',
    );
    expect(link).toHaveAttribute('target', '_blank');
  });
});

describe('SettingsPage — wazuh_brain hidden from provider type choices', () => {
  it('does not offer wazuh_brain among the provider type cards when the form is open', async () => {
    render(
      <SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />,
    );

    const addButton = await screen.findByRole('button', {
      name: /add provider/i,
    });
    fireEvent.click(addButton);

    // Wait for the form to be visible (Name field is present)
    await screen.findByLabelText(/^name/i);

    // Provider type is an EuiButtonGroup of two options, each backed by a hidden native radio
    // input — assert on those directly rather than on <option> elements.
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    // The label is the type name alone now; the list of services it covers moved down into the
    // card's own description, which had the room for it (provider-form-flyout.tsx).
    // getByLabelText throws here: EUI's button-group radios sit in a <label> whose `for` points
    // at the group's own generated id, a non-labellable <fieldset> in this test environment (see
    // provider-form-flyout.test.tsx's providerTypeOption helper). The visible text is what
    // matters for this assertion, but an unscoped getByText also matches the empty-state prompt's
    // own body copy ("...OpenAI-compatible or Anthropic...") still in the DOM behind the flyout —
    // so, like that helper, this scopes to the radio's own wrapping <label> via its stable
    // data-test-subj instead of querying the whole document.
    const openaiCompatibleOption = document.querySelector(
      'input[data-test-subj="openai_compatible"]',
    ) as HTMLElement;
    const anthropicOption = document.querySelector(
      'input[data-test-subj="anthropic"]',
    ) as HTMLElement;
    expect(openaiCompatibleOption).not.toBeNull();
    expect(anthropicOption).not.toBeNull();
    expect(openaiCompatibleOption.closest('label')?.textContent).toMatch(
      /openai-compatible/i,
    );
    expect(anthropicOption.closest('label')?.textContent).toMatch(
      /anthropic \(claude\)/i,
    );
    expect(
      document.querySelector('input[data-test-subj="wazuh_brain"]'),
    ).toBeNull();
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

    render(
      <SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />,
    );

    await waitFor(() => {
      expect(mockService.test).toHaveBeenCalledWith('p1');
    });
  });

  it('does not call service.test when there are no providers', async () => {
    render(
      <SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />,
    );

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
      model: 'claude-sonnet-5',
      isDefault: false,
    },
  ];

  it('only re-tests the providers the "Filter providers" box is currently showing', async () => {
    mockService.list.mockResolvedValue(threeProviders);

    render(
      <SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />,
    );

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

    render(
      <SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />,
    );

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
      privacyDefaultPerProvider: {},
      fieldPolicy: [
        { field: 'agent.name', action: 'allow' },
        { field: 'source.ip', action: 'anonymize' },
      ],
      conversationRetentionDays: 0,
    });

    render(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=privacy']}
      />,
    );

    const filterInput = await screen.findByPlaceholderText(/filter fields/i);
    expect(filterInput).toBeInTheDocument();

    expect(await screen.findByDisplayValue('agent.name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('source.ip')).toBeInTheDocument();

    fireEvent.change(filterInput, { target: { value: 'agent' } });

    expect(screen.getByDisplayValue('agent.name')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('source.ip')).not.toBeInTheDocument();
  });

  it('shows a "no matches" message instead of an empty table when the filter matches nothing', async () => {
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: {},
      fieldPolicy: [{ field: 'agent.name', action: 'allow' }],
      conversationRetentionDays: 0,
    });

    render(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=privacy']}
      />,
    );

    const filterInput = await screen.findByPlaceholderText(/filter fields/i);
    // The "Field"/"Action" column heads are table chrome with nothing under them once the
    // filter matches zero rows — they must go away along with the rows, not linger empty.
    expect(screen.getByText(/^field$/i)).toBeInTheDocument();

    fireEvent.change(filterInput, { target: { value: 'asdf' } });

    expect(screen.getByText(/0 found/i)).toBeInTheDocument();
    expect(screen.getByText(/no fields match “asdf”/i)).toBeInTheDocument();
    expect(screen.queryByText(/^field$/i)).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('agent.name')).not.toBeInTheDocument();
    // The search box and "Add field" stay put — a dead-end filter shouldn't strand the admin.
    expect(filterInput).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add field/i }),
    ).toBeInTheDocument();
  });

  it('caps the list at 5 rows behind "Show N more"/"Show less" — no collapsible section', async () => {
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: {},
      fieldPolicy: Array.from({ length: 7 }, (_, i) => ({
        field: `field.${i}`,
        action: 'allow' as const,
      })),
      conversationRetentionDays: 0,
    });

    render(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=privacy']}
      />,
    );

    // No "Field rules (N)" toggle any more — the search box and rows are visible without a click.
    await screen.findByPlaceholderText(/filter fields/i);
    expect(
      screen.queryByRole('button', { name: /field rules/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/7 found/i)).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/e\.g\. agent\.name/i)).toHaveLength(
      5,
    );
    expect(
      screen.queryByRole('button', { name: /show less/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show 2 more/i }));

    expect(screen.getAllByPlaceholderText(/e\.g\. agent\.name/i)).toHaveLength(
      7,
    );
    expect(
      screen.queryByRole('button', { name: /show .* more/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('field.0')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show less/i }));

    // Back to 5 — but the first 5 (including field.0) were never the ones hidden.
    expect(screen.getAllByPlaceholderText(/e\.g\. agent\.name/i)).toHaveLength(
      5,
    );
    expect(screen.getByDisplayValue('field.0')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /show 2 more/i }),
    ).toBeInTheDocument();
  });

  it('"Add field" reveals only its own new row, not the rest of a collapsed list', async () => {
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: {},
      fieldPolicy: Array.from({ length: 7 }, (_, i) => ({
        field: `field.${i}`,
        action: 'allow' as const,
      })),
      conversationRetentionDays: 0,
    });

    render(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=privacy']}
      />,
    );

    await screen.findByPlaceholderText(/filter fields/i);
    expect(screen.getAllByPlaceholderText(/e\.g\. agent\.name/i)).toHaveLength(
      5,
    );

    fireEvent.click(screen.getByRole('button', { name: /add field/i }));

    // 5 existing rows still capped + the 1 new blank row — 6, NOT all 8. Clicking "Add field"
    // must never dump the rest of an already-collapsed list onto the screen.
    const rows = screen.getAllByPlaceholderText(/e\.g\. agent\.name/i);
    expect(rows).toHaveLength(6);
    expect(rows[rows.length - 1]).toHaveValue('');
    // "Show N more" still offers the 2 existing rows that stayed hidden (7 existing - 5 visible).
    expect(
      screen.getByRole('button', { name: /show 2 more/i }),
    ).toBeInTheDocument();
  });
});

// The per-field action select drops `allow-scan` from the choices it OFFERS, while the server
// keeps it a valid STORED action (server/tools/privacy.ts) so existing/default `allow-scan`
// fields keep working and keep their server-side injection scan. These tests pin the three-way
// symmetry, the display-only "Allow" mapping, and — the part most at risk of a careless
// implementation coercing it on load/display — that a row nobody touched still round-trips as
// `allow-scan`, not `allow`.
describe('SettingsPage — field policy action select (symmetry pass)', () => {
  const renderOnPrivacyTab = () =>
    render(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=privacy']}
      />,
    );

  it('offers exactly three action options, with no allow-scan among them', async () => {
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: {},
      fieldPolicy: [{ field: 'agent.name', action: 'allow' }],
      conversationRetentionDays: 0,
    });
    renderOnPrivacyTab();

    const actionSelect = await screen.findByRole('combobox', {
      name: /^action$/i,
    });
    const optionTexts = within(actionSelect)
      .getAllByRole('option')
      .map(option => option.textContent);
    expect(optionTexts).toEqual(['Allow', 'Anonymize', 'Never send']);
  });

  it('displays a stored allow-scan field as "Allow" — the word "scanned" never appears', async () => {
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: {},
      fieldPolicy: [{ field: 'package.name', action: 'allow-scan' }],
      conversationRetentionDays: 0,
    });
    renderOnPrivacyTab();

    const actionSelect = await screen.findByRole('combobox', {
      name: /^action$/i,
    });
    expect(actionSelect).toHaveValue('allow');
    // Scoped to this field row specifically (not the whole document): the privacy tab's own
    // top-level description now legitimately uses the word "scanned" (F9 — it accurately
    // describes what typed chat text goes through), so a page-wide query would false-positive on
    // that unrelated text. What this test actually guards is narrower: THIS row's own controls
    // must not leak the internal "allow-scan" action name/wording anywhere near the collapsed
    // "Allow" display.
    const row = actionSelect.closest('.euiFlexGroup') as HTMLElement;
    expect(row).not.toBeNull();
    expect(within(row).queryByText(/scanned/i)).not.toBeInTheDocument();
  });

  it('saves an untouched allow-scan row back unchanged, not coerced to allow', async () => {
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: {},
      fieldPolicy: [{ field: 'package.name', action: 'allow-scan' }],
      conversationRetentionDays: 0,
    });
    renderOnPrivacyTab();

    await screen.findByRole('combobox', { name: /^action$/i });
    // Nothing about the field-policy row itself is touched — dirty state is raised through an
    // unrelated switch instead, purely to make the (otherwise legitimately disabled-while-clean)
    // Save button clickable, so the save this test inspects is genuinely a no-op on this row.
    // Located by its label text, not by role+name: every tab's card stays mounted (hidden, not
    // unmounted) so multiple EuiSwitch instances share this env's mocked htmlIdGenerator output,
    // which makes aria-labelledby-based accessible-name lookup resolve to the wrong switch (see
    // the "puts the retention field..." test above for the same caveat on EuiFormRow's `for`).
    const switchLabel = screen.getByText(/enable privacy mode by default/i);
    fireEvent.click(
      switchLabel.closest('.euiSwitch')!.querySelector('[role="switch"]')!,
    );
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(mockService.updateAssistantSettings).toHaveBeenCalled(),
    );
    const payload = mockService.updateAssistantSettings.mock.calls[0][0];
    expect(payload.fieldPolicy).toEqual([
      { field: 'package.name', action: 'allow-scan' },
    ]);
  });

  it('persists an explicit edit away from allow-scan (e.g. to Anonymize)', async () => {
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: {},
      fieldPolicy: [{ field: 'package.name', action: 'allow-scan' }],
      conversationRetentionDays: 0,
    });
    renderOnPrivacyTab();

    const actionSelect = await screen.findByRole('combobox', {
      name: /^action$/i,
    });
    fireEvent.change(actionSelect, { target: { value: 'anonymize' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(mockService.updateAssistantSettings).toHaveBeenCalled(),
    );
    const payload = mockService.updateAssistantSettings.mock.calls[0][0];
    expect(payload.fieldPolicy).toEqual([
      { field: 'package.name', action: 'anonymize' },
    ]);
  });
});

describe('SettingsPage — settings-access probe', () => {
  it('fails open (page usable, nothing blocked) when the settings-access probe itself fails', async () => {
    mockService.getSettingsAccess.mockRejectedValue(new Error('network error'));

    render(
      <SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />,
    );

    await waitFor(() =>
      expect(mockService.getSettingsAccess).toHaveBeenCalled(),
    );
    expect(
      await screen.findByRole('button', { name: /add provider/i }),
    ).toBeEnabled();
  });
});

describe('SettingsPage — auto-open create-provider flyout (?addProvider=true)', () => {
  it('opens the create form and reports it open when autoOpenCreateForm is true', async () => {
    const onOpenChange = jest.fn();

    render(
      <SettingsPageWithRouter
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
    render(
      <SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />,
    );

    await screen.findByRole('button', { name: /add provider/i });
    expect(screen.queryByLabelText(/^name\s*\*?$/i)).not.toBeInTheDocument();
  });

  // The URL only ever reflected a deep link INTO the create flow — opening the same flyout from
  // the page's own "Add provider" button left `?addProvider=true` out of the address bar
  // entirely, so the state wasn't shareable/bookmarkable/refresh-safe.
  it('reports the create form open when "Add provider" is clicked directly, not only via the URL flag', async () => {
    const onOpenChange = jest.fn();

    render(
      <SettingsPageWithRouter
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
      <SettingsPageWithRouter
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
      <SettingsPageWithRouter
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
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        autoOpenCreateForm={true}
      />,
    );
    expect(await screen.findByLabelText(/^name\s*\*?$/i)).toBeInTheDocument();

    rerender(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        autoOpenCreateForm={true}
        isActive={false}
      />,
    );

    expect(screen.queryByLabelText(/^name\s*\*?$/i)).toBeNull();
  });
});

describe('SettingsPage — settings tabs', () => {
  /**
   * True when the element sits inside a subtree hidden with `display: none` — the same idiom
   * application.test.tsx's own `isHidden` uses for the outer Chat/Settings tabs (application.tsx),
   * shared by these inner tabs: all three cards stay MOUNTED at all times so EuiInMemoryTable's
   * own uncontrolled search box never resets on a tab switch, so a plain
   * `queryByText(...).not.toBeInTheDocument()` no longer tells the other cards' content apart —
   * their text is still in the DOM, just hidden.
   */
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

  it('renders the three tabs, Providers selected by default', async () => {
    render(
      <SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />,
    );

    const providersTab = await screen.findByRole('tab', {
      name: /^providers$/i,
    });
    const privacyTab = screen.getByRole('tab', {
      name: /privacy & data protection/i,
    });
    const retentionTab = screen.getByRole('tab', {
      name: /conversation history/i,
    });

    expect(providersTab).toHaveAttribute('aria-selected', 'true');
    expect(privacyTab).toHaveAttribute('aria-selected', 'false');
    expect(retentionTab).toHaveAttribute('aria-selected', 'false');
    // The Providers card's own content (its "Add provider" empty-state action, distinct from the
    // page header's own button of the same name) is visible; the other two cards' content isn't.
    expect(
      screen.getByRole('button', { name: /add a provider/i }),
    ).toBeInTheDocument();
    expect(isHidden(screen.getByText(/enable privacy mode by default/i))).toBe(
      true,
    );
    expect(isHidden(screen.getByText(/keep saved conversations for/i))).toBe(
      true,
    );
  });

  it('switches which card is shown when a tab is clicked, and updates the URL', async () => {
    render(
      <SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />,
    );

    await screen.findByRole('button', { name: /add provider/i });

    fireEvent.click(
      screen.getByRole('tab', { name: /privacy & data protection/i }),
    );
    const privacyText = await screen.findByText(
      /enable privacy mode by default/i,
    );
    expect(isHidden(privacyText)).toBe(false);
    expect(
      screen.queryByRole('button', { name: /add a provider/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /conversation history/i }));
    const retentionText = await screen.findByText(
      /keep saved conversations for/i,
    );
    expect(isHidden(retentionText)).toBe(false);
    expect(isHidden(screen.getByText(/enable privacy mode by default/i))).toBe(
      true,
    );
  });

  it('does not switch tabs (or push a new URL entry) when clicking the already-active tab', async () => {
    render(
      <SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />,
    );

    const providersTab = await screen.findByRole('tab', {
      name: /^providers$/i,
    });
    expect(providersTab).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(providersTab);

    // Still on Providers, and clicking the active tab must not have unmounted/remounted its card
    // (which would have reset EuiInMemoryTable's own search box — see the B1 test below).
    expect(providersTab).toHaveAttribute('aria-selected', 'true');
    expect(
      screen.getByRole('button', { name: /add a provider/i }),
    ).toBeInTheDocument();
  });

  it('preserves other query params when switching tabs, and restores them on the way back', async () => {
    // A real `history` instance (rather than `MemoryRouter`'s own, which this test has no handle
    // on) so `history.location.search` can be asserted directly — the actual URL, not just what
    // rendered.
    const history = createMemoryHistory({
      initialEntries: ['/settings?utm_source=digest&tab=privacy'],
    });
    render(
      <Router history={history}>
        <SettingsPage core={coreMock} onProvidersChanged={jest.fn()} />
      </Router>,
    );

    await screen.findByText(/enable privacy mode by default/i);

    fireEvent.click(screen.getByRole('tab', { name: /^providers$/i }));
    await screen.findByRole('button', { name: /add a provider/i });
    // Providers is this page's DEFAULT tab, so `?tab=` itself drops — but `utm_source` (an
    // unrelated param neither this page nor its tabs own) must survive the switch regardless.
    expect(history.location.search).toBe('?utm_source=digest');

    fireEvent.click(screen.getByRole('tab', { name: /conversation history/i }));
    await screen.findByText(/keep saved conversations for/i);
    const afterRetention = new URLSearchParams(history.location.search);
    expect(afterRetention.get('utm_source')).toBe('digest');
    expect(afterRetention.get('tab')).toBe('retention');

    // Back/forward: history navigation must land the page on the tab that URL entry names,
    // exactly as a click on that tab would, and must not lose `utm_source` either.
    act(() => {
      history.goBack();
    });
    await screen.findByRole('button', { name: /add a provider/i });
    const afterBack = new URLSearchParams(history.location.search);
    expect(afterBack.get('tab')).toBeNull();
    expect(afterBack.get('utm_source')).toBe('digest');

    act(() => {
      history.goForward();
    });
    await screen.findByText(/keep saved conversations for/i);
    const afterForward = new URLSearchParams(history.location.search);
    expect(afterForward.get('tab')).toBe('retention');
    expect(afterForward.get('utm_source')).toBe('digest');
  });

  it('lands on the Privacy tab when deep-linked with ?tab=privacy', async () => {
    render(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=privacy']}
      />,
    );

    expect(
      await screen.findByText(/enable privacy mode by default/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /privacy & data protection/i }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('lands on the Providers tab when deep-linked with ?tab=retention&addProvider=true', async () => {
    // The create-provider flyout only belongs to the Providers tab — an addProvider deep link
    // must win over any (nonsensical) `?tab=` value it might be combined with.
    render(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        autoOpenCreateForm={true}
        initialEntries={['/settings?tab=retention&addProvider=true']}
      />,
    );

    expect(await screen.findByLabelText(/^name\s*\*?$/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^providers$/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('falls back to the Providers tab for an unknown ?tab= value', async () => {
    render(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=nonsense']}
      />,
    );

    expect(
      await screen.findByRole('tab', { name: /^providers$/i }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('lets a tab click through after Cancel closes the create form, and drops addProvider from the URL', async () => {
    // A real `history` so `onCreateFormOpenChange` can reproduce application.tsx's OWN history
    // write (it replaces the whole URL with just `?addProvider=true`/bare `/settings`, dropping
    // `?tab=` entirely) — the exact second, racing history write this behavior must win against.
    const history = createMemoryHistory({
      initialEntries: ['/settings?tab=privacy'],
    });
    render(
      <Router history={history}>
        <SettingsPage
          core={coreMock}
          onProvidersChanged={jest.fn()}
          onCreateFormOpenChange={open => {
            history.replace(open ? '/settings?addProvider=true' : '/settings');
          }}
        />
      </Router>,
    );

    await screen.findByText(/enable privacy mode by default/i);

    // The header's "Add provider" button (visible on every tab) opens the create flyout and sets
    // `?addProvider=true`, exactly like the real app's onCreateFormOpenChange wiring.
    fireEvent.click(screen.getByRole('button', { name: /^add provider$/i }));
    await screen.findByLabelText(/^name\s*\*?$/i);
    expect(history.location.search).toBe('?addProvider=true');

    // Cancel the form without saving.
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    await waitFor(() =>
      expect(screen.queryByLabelText(/^name\s*\*?$/i)).not.toBeInTheDocument(),
    );

    // `addProvider` must already be gone, and the admin should be back on Privacy...
    expect(
      new URLSearchParams(history.location.search).get('addProvider'),
    ).toBeNull();
    expect(
      screen.getByRole('tab', { name: /privacy & data protection/i }),
    ).toHaveAttribute('aria-selected', 'true');

    // ...and a subsequent tab click must actually take effect (the bug: the arrival-forcing
    // effect kept re-selecting Providers as long as `addProvider` lingered, swallowing this click).
    fireEvent.click(screen.getByRole('tab', { name: /conversation history/i }));
    await screen.findByText(/keep saved conversations for/i);
    expect(
      screen.getByRole('tab', { name: /conversation history/i }),
    ).toHaveAttribute('aria-selected', 'true');
    expect(
      new URLSearchParams(history.location.search).get('addProvider'),
    ).toBeNull();
    expect(new URLSearchParams(history.location.search).get('tab')).toBe(
      'retention',
    );
  });

  it('keeps the Providers filter box and its filtered "Test all" set intact across a tab round trip', async () => {
    // This pins: the Providers card must not UNMOUNT on a tab switch (`activeTabId ===
    // 'providers' && (...)`), which would reset EuiInMemoryTable's own uncontrolled search box on
    // remount — while `providersFilterText` (page-level state, mirrored out of that search box
    // purely to tell "Test all" which rows are visible) survives the switch untouched. Landing
    // back on Providers would otherwise show an EMPTY search box while "Test all" still silently
    // acts on the STALE filtered subset from before the round trip.
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
        model: 'claude-sonnet-5',
        isDefault: false,
      },
    ];
    mockService.list.mockResolvedValue(threeProviders);
    render(
      <SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />,
    );

    await waitFor(() => expect(mockService.test).toHaveBeenCalledTimes(3));
    mockService.test.mockClear();

    const filterBox = await screen.findByPlaceholderText(/filter providers/i);
    fireEvent.change(filterBox, { target: { value: 'matched' } });

    fireEvent.click(
      screen.getByRole('tab', { name: /privacy & data protection/i }),
    );
    await screen.findByText(/enable privacy mode by default/i);
    fireEvent.click(screen.getByRole('tab', { name: /^providers$/i }));

    expect(await screen.findByPlaceholderText(/filter providers/i)).toHaveValue(
      'matched',
    );

    fireEvent.click(screen.getByRole('button', { name: /test all/i }));
    await waitFor(() => expect(mockService.test).toHaveBeenCalledWith('p3'));
    expect(mockService.test).not.toHaveBeenCalledWith('p1');
    expect(mockService.test).not.toHaveBeenCalledWith('p2');
  });

  it('sends the header "Add provider" button to the Providers tab, and back to the original tab when the flyout closes', async () => {
    // The header button (distinct from the Providers card's own empty-state "Add a provider"
    // action) is visible on every tab, but the create form only ever lives on the Providers tab
    // — clicking it from Privacy must switch to the Providers tab rather than opening the flyout
    // ON TOP of the (still-selected) Privacy tab.
    render(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=privacy']}
      />,
    );
    await screen.findByText(/enable privacy mode by default/i);

    fireEvent.click(screen.getByRole('button', { name: /^add provider$/i }));

    expect(await screen.findByLabelText(/^name\s*\*?$/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^providers$/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByLabelText(/^name\s*\*?$/i)).not.toBeInTheDocument();
    // Back on Privacy — the tab the admin actually clicked "Add provider" from.
    expect(
      await screen.findByRole('tab', { name: /privacy & data protection/i }),
    ).toHaveAttribute('aria-selected', 'true');
  });
});

describe('SettingsPage — per-provider privacy override', () => {
  const twoProviders = [
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
      type: 'anthropic',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-sonnet-5',
      isDefault: false,
    },
  ];

  const renderOnPrivacyTab = () =>
    render(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=privacy']}
      />,
    );

  it('lists every configured provider, defaulting to "Use global default"', async () => {
    mockService.list.mockResolvedValue(twoProviders);
    renderOnPrivacyTab();

    // Scoped to the per-provider block: tabs keep all cards mounted (B1), so the Providers
    // table's own "Alpha"/"Beta" rows are ALSO in the DOM at the same time as this list, making
    // an unscoped getByText (or findByText) ambiguous. Waiting on the combobox itself (unique by
    // its own aria-label) sidesteps that, and `data-test-subj` (EUI's own attribute, not RTL's
    // default `data-testid`) is queried directly, matching this file's other data-test-subj
    // lookups.
    const alphaSelect = await screen.findByRole('combobox', {
      name: /privacy override for alpha/i,
    });
    const perProviderList = within(
      document.querySelector(
        '[data-test-subj="wzPerProviderPrivacyList"]',
      ) as HTMLElement,
    );
    expect(perProviderList.getByText('Alpha')).toBeInTheDocument();
    expect(perProviderList.getByText('Beta')).toBeInTheDocument();
    expect(alphaSelect).toHaveValue('inherit');
    expect(
      screen.getByRole('combobox', { name: /privacy override for beta/i }),
    ).toHaveValue('inherit');
  });

  it('starts a provider already in privacyDefaultPerProvider at its stored state, not inherit', async () => {
    mockService.list.mockResolvedValue(twoProviders);
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: { p1: true, p2: false },
      fieldPolicy: [],
      conversationRetentionDays: 0,
    });
    renderOnPrivacyTab();

    expect(
      await screen.findByRole('combobox', {
        name: /privacy override for alpha/i,
      }),
    ).toHaveValue('on');
    expect(
      screen.getByRole('combobox', { name: /privacy override for beta/i }),
    ).toHaveValue('off');
  });

  it('sends an explicit true, and omits the key entirely for a reverted provider', async () => {
    mockService.list.mockResolvedValue(twoProviders);
    renderOnPrivacyTab();

    const alphaSelect = await screen.findByRole('combobox', {
      name: /privacy override for alpha/i,
    });
    fireEvent.change(alphaSelect, { target: { value: 'on' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(mockService.updateAssistantSettings).toHaveBeenCalled(),
    );
    const payload = mockService.updateAssistantSettings.mock.calls[0][0];
    // Explicit true for the provider switched to "On"; the untouched one is simply absent —
    // never a `false` it never had. `toEqual` treats an undefined-valued key as equivalent to a
    // MISSING one, so it would have passed even if `p2: undefined` had leaked into the payload;
    // `toStrictEqual` plus the explicit `in` check below catch that.
    expect(payload.privacyDefaultPerProvider).toStrictEqual({ p1: true });
    expect('p2' in payload.privacyDefaultPerProvider).toBe(false);
  });

  it('sends an explicit false for "Off", distinct from an absent key', async () => {
    mockService.list.mockResolvedValue(twoProviders);
    renderOnPrivacyTab();

    const betaSelect = await screen.findByRole('combobox', {
      name: /privacy override for beta/i,
    });
    fireEvent.change(betaSelect, { target: { value: 'off' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(mockService.updateAssistantSettings).toHaveBeenCalled(),
    );
    const payload = mockService.updateAssistantSettings.mock.calls[0][0];
    expect(payload.privacyDefaultPerProvider).toStrictEqual({ p2: false });
    expect('p1' in payload.privacyDefaultPerProvider).toBe(false);
  });

  it('reverting a provider to "Use global default" removes its key entirely', async () => {
    mockService.list.mockResolvedValue(twoProviders);
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: { p1: true, p2: false },
      fieldPolicy: [],
      conversationRetentionDays: 0,
    });
    renderOnPrivacyTab();

    const alphaSelect = await screen.findByRole('combobox', {
      name: /privacy override for alpha/i,
    });
    expect(alphaSelect).toHaveValue('on');
    fireEvent.change(alphaSelect, { target: { value: 'inherit' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(mockService.updateAssistantSettings).toHaveBeenCalled(),
    );
    const payload = mockService.updateAssistantSettings.mock.calls[0][0];
    // p1's key is gone entirely (inherit), p2's explicit false survives untouched.
    expect(payload.privacyDefaultPerProvider).toStrictEqual({ p2: false });
    expect('p1' in payload.privacyDefaultPerProvider).toBe(false);
  });

  it('carries the first save forward as the starting point of a second, consecutive save', async () => {
    // `mockService.updateAssistantSettings` now echoes its payload back (rather than an
    // unconditional `{}`), so this exercises the real round-trip: the second save's payload must
    // build on what the FIRST save actually persisted, not on some earlier stub.
    mockService.list.mockResolvedValue(twoProviders);
    renderOnPrivacyTab();

    const alphaSelect = await screen.findByRole('combobox', {
      name: /privacy override for alpha/i,
    });
    fireEvent.change(alphaSelect, { target: { value: 'on' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(mockService.updateAssistantSettings).toHaveBeenCalledTimes(1),
    );
    expect(
      mockService.updateAssistantSettings.mock.calls[0][0]
        .privacyDefaultPerProvider,
    ).toStrictEqual({ p1: true });

    const betaSelect = screen.getByRole('combobox', {
      name: /privacy override for beta/i,
    });
    fireEvent.change(betaSelect, { target: { value: 'off' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(mockService.updateAssistantSettings).toHaveBeenCalledTimes(2),
    );
    // p1's override from the FIRST save survives into the second save's payload.
    expect(
      mockService.updateAssistantSettings.mock.calls[1][0]
        .privacyDefaultPerProvider,
    ).toStrictEqual({ p1: true, p2: false });
  });

  it('shows an empty-state message instead of a table when no providers are configured', async () => {
    mockService.list.mockResolvedValue([]);
    renderOnPrivacyTab();

    expect(
      await screen.findByText(/no providers configured yet/i),
    ).toBeInTheDocument();
  });

  it('shows neither the empty message nor a row while the provider list is still loading', async () => {
    // A bare `providers.length === 0` read as "empty" both WHILE the (async) list load was still
    // pending and after it had actually FAILED — either way telling the admin "No providers
    // configured yet." about a fleet that might be non-empty. This holds the mock's promise open
    // to catch that window.
    let resolveList!: (value: typeof twoProviders) => void;
    mockService.list.mockReturnValue(
      new Promise(resolve => {
        resolveList = resolve;
      }),
    );
    renderOnPrivacyTab();

    // Scoped to the per-provider block for the same reason as the test above: the Providers
    // table's own rows (once loaded) share "Alpha"'s text with this list, and while the provider
    // list promise is still pending the container itself has already rendered (just with nothing
    // inside it). The container only mounts once the SEPARATE `getAssistantSettings()` load
    // resolves and `privacyDraft` stops being null — that resolves on the microtask queue even
    // though the mock is synchronous (`mockResolvedValue`), so this waits for it rather than
    // querying immediately after the synchronous `render()` call above, which ran before that
    // microtask had a chance to flush.
    const perProviderContainer = await waitFor(() => {
      const container = document.querySelector(
        '[data-test-subj="wzPerProviderPrivacyList"]',
      ) as HTMLElement;
      expect(container).not.toBeNull();
      return container;
    });
    const perProviderList = within(perProviderContainer);
    expect(
      perProviderList.queryByText(/no providers configured yet/i),
    ).not.toBeInTheDocument();
    expect(perProviderList.queryByText('Alpha')).not.toBeInTheDocument();

    resolveList(twoProviders);
    expect(await perProviderList.findByText('Alpha')).toBeInTheDocument();
    expect(
      perProviderList.queryByText(/no providers configured yet/i),
    ).not.toBeInTheDocument();
  });
});

/**
 * Layout/hierarchy invariants: the page's 1200px measure is CORRECT ("do not narrow it and do
 * not widen it") — the void sits INSIDE the two form cards, and the hierarchy holds at the
 * section tier.
 *
 * jsdom computes no layout, so the DOM tests below pin the STRUCTURE these invariants rest on and
 * the stylesheet tests pin the declarations, the same split chat-page.test.tsx uses for its grid.
 */
describe('SettingsPage — in-card layout and hierarchy', () => {
  const scss = () =>
    fs.readFileSync(path.join(__dirname, 'settings-page.scss'), 'utf8');

  /**
   * Deliberately NOT queried through `findByLabelText`. Measured on the VM against this EUI build,
   * neither control is reachable that way: the switch's caption is not associated with a labellable
   * element at all (EuiSwitch's control is a `<button role="switch">`, which a `<label for>` cannot
   * label), and the retention row's label resolved to a button rather than to its own input. The
   * caption TEXT and the control's ROLE are the hooks that do hold — and they are what these
   * assertions are actually about, which is which column a block sits in.
   */
  it('splits privacy into three stacked full-width cards instead of a two-column layout', async () => {
    render(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=privacy']}
      />,
    );
    const switchCaption = await screen.findByText(
      /enable privacy mode by default/i,
    );

    // Each topic now owns its own bordered `.wzSettingsCard` instead of sharing one two-column
    // flex row, so the switches' card carries no trace of the field-policy editor next to it.
    const switchCard = switchCaption.closest('.wzSettingsCard') as HTMLElement;
    expect(switchCard).not.toBeNull();
    expect(switchCard.textContent).not.toContain('Field policy');

    // The three cards read top to bottom in the same order the page always explained them in.
    // Scoped to the privacy tab's own wrapper (the switch card's parent) so the Providers and
    // Retention tabs' own cards — mounted but hidden, not unmounted (design B1) — never leak in.
    const tabWrapper = switchCard.parentElement as HTMLElement;
    const pills = Array.from(
      tabWrapper.querySelectorAll('.wzSettingsCard__pill'),
    ).map(pill => pill.textContent);
    expect(pills).toEqual([
      'Global settings',
      'Field policy',
      'Per-provider override',
    ]);
  });

  it('puts the retention field and its explanation side by side', async () => {
    render(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=retention']}
      />,
    );
    // The page's only number input, so its role names it unambiguously — and unlike the form row's
    // label, the input itself is a hook that survives however EuiFormRow wires `for`.
    const field = await screen.findByRole('spinbutton');

    const row = field.closest('.euiFlexGroup') as HTMLElement;
    expect(row).not.toBeNull();
    // The sentence moved OUT of the row's `helpText` slot (which can only render under the field)
    // and into the second column, where it fills the void a 327px input left in a 1150px row. It
    // keeps the help typography by class rather than by a third EuiText size.
    const help = screen.getByText(/0 keeps every saved conversation forever/i);
    expect(help).toHaveClass('wzSettingsCard__fieldHelp');
    expect(row.contains(help)).toBe(true);
  });

  it('drops the fill on a disabled Save button', async () => {
    // Both cards' Save buttons read the same `fill={!disabled}` expression, but each lives on its
    // own tab, so this switches tabs between the two halves of the assertion instead of finding
    // both buttons in one render.
    render(
      <SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />,
    );

    fireEvent.click(screen.getByRole('tab', { name: /conversation history/i }));
    const save = await screen.findByRole('button', {
      name: /save conversation history settings/i,
    });
    // Nothing has been edited yet, so this is in the disabled state the audit measured as one of
    // the two darkest slabs on the page, at ~2.2:1 against its own label.
    expect(save).toBeDisabled();
    expect(save.className).not.toMatch(/fill/i);

    fireEvent.change(await screen.findByRole('spinbutton'), {
      target: { value: '30' },
    });

    // Dirty now: the button is both enabled and filled, i.e. fill tracks "you can press this".
    await waitFor(() => expect(save).toBeEnabled());
    expect(save.className).toMatch(/fill/i);

    fireEvent.click(
      screen.getByRole('tab', { name: /privacy & data protection/i }),
    );
    // Privacy's own Save moved into a bottom bar (indexer-settings/index.tsx's pattern) that
    // only mounts once there is something to save — so, unlike Retention's inline (and always
    // rendered, just disabled) button, nothing has been edited here yet means no bar at all.
    await screen.findByText(/enable privacy mode by default/i);
    expect(
      screen.queryByRole('button', { name: /save changes/i }),
    ).not.toBeInTheDocument();
  });

  it('shows the privacy bottom bar only while there is something unsaved, and Cancel discards it', async () => {
    render(
      <SettingsPageWithRouter
        core={coreMock}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=privacy']}
      />,
    );

    const switchLabel = await screen.findByText(
      /enable privacy mode by default/i,
    );
    expect(
      screen.queryByRole('button', { name: /save changes/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      switchLabel.closest('.euiSwitch')!.querySelector('[role="switch"]')!,
    );

    const save = await screen.findByRole('button', { name: /save changes/i });
    expect(save).toBeEnabled();
    expect(save.className).toMatch(/fill/i);
    expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel changes/i }));

    // Reset back to the loaded value, so nothing is dirty and the bar is gone again.
    expect(
      screen.queryByRole('button', { name: /save changes/i }),
    ).not.toBeInTheDocument();
  });

  it('keeps the section cards, their descriptions and their rules on one measure', () => {
    // §4.6: `wzPanel`'s 12px radius was a single class tying with EUI's own single-class
    // `.euiPanel--borderRadiusMedium`, so bundle order decided it — and EUI's 4px won in the
    // deployed build. Compounding the two classes the element already carries settles it.
    expect(scss()).toMatch(/\.euiPanel#\{&\}__panel/);
    // §4.3/§4.4: the card description and the rule above the Save button stop at the reading
    // measure instead of running the card's full 1150px.
    expect(scss()).toMatch(/&__description \{[^}]*max-width: \$wzProseMeasure/);
    expect(scss()).toMatch(/&__actionsRule \{[^}]*max-width: \$wzProseMeasure/);
  });

  it('ranks the section pill above the body text it introduces', () => {
    // §4.2: at wzMicroLabel's 11px/600 subdued the pill was QUIETER than its own 14px/400
    // description under a 28px H1 — the hierarchy ran 28 → 11 → 14. Same idiom, one weight step up
    // and the full text color, rather than a fourth font size.
    expect(scss()).toMatch(
      /&__pill \{[^}]*color: \$euiTextColor;\s*font-size: 12px;\s*font-weight: 700/,
    );
  });

  it('contains every table cell inside its own column, without depending on a prop', () => {
    // §4.1, the page's worst rendering bug: a long endpoint painted straight over the Model column.
    // `anchorClassName` is how the render site declares its intent, but the prop is EUI-version
    // dependent — these two rules bound the cell and the tooltip anchor by their OWN EUI classes, so
    // the fix survives a build that ignores it.
    expect(scss()).toMatch(
      /\.wzSettingsPage td \.euiTableCellContent \{\s*min-width: 0/,
    );
    expect(scss()).toMatch(
      /\.wzSettingsPage td \.euiToolTipAnchor \{[^}]*max-width: 100%[^}]*overflow: hidden/,
    );
  });

  it('sets both tables’ column heads in the micro-label idiom', () => {
    // §3.6/§4.7: `wzMicroLabel` documents itself as the idiom for "section headers and table column
    // heads", and both tables were ignoring it — a header row read as one more data row.
    expect(scss()).toMatch(
      /\.wzSettingsPage \.euiTableHeaderCell \{\s*@include wzMicroLabel/,
    );
    const resultTableScss = fs.readFileSync(
      path.join(__dirname, '..', 'chat', 'result-table.scss'),
      'utf8',
    );
    expect(resultTableScss).toMatch(
      /\.wzResultsCard \.euiTableHeaderCell \{\s*@include wzMicroLabel/,
    );
  });
});

/**
 * Cross-view propagation. Chat and Settings both stay mounted behind `display: none`
 * (application.tsx), and the header flyout holds a SECOND, independent ChatPage and
 * `useProviders` instance — so neither a saved privacy policy nor a provider CRUD action would
 * reach them without an explicit signal. Both are announced with a window event; these cases
 * prove the dispatch side.
 */
describe('SettingsPage — announcing saved changes to the mounted chat', () => {
  /** Records every dispatch of `eventName` for the duration of one test. */
  function listenFor(eventName: string): {
    count: () => number;
    stop: () => void;
  } {
    let seen = 0;
    const handler = () => {
      seen += 1;
    };
    window.addEventListener(eventName, handler);
    return {
      count: () => seen,
      stop: () => window.removeEventListener(eventName, handler),
    };
  }

  it('dispatches ASSISTANT_SETTINGS_CHANGED_EVENT after a successful privacy save', async () => {
    // With no providers the page renders the "No AI provider configured" empty prompt instead of
    // the Privacy section, so every privacy case here needs at least one provider loaded.
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.updateAssistantSettings.mockResolvedValue({
      privacyDefaultOn: true,
      privacyDefaultPerProvider: {},
      userCanOverride: false,
      fieldPolicy: [],
      conversationRetentionDays: 0,
    });
    const heard = listenFor(ASSISTANT_SETTINGS_CHANGED_EVENT);

    try {
      render(
        <SettingsPageWithRouter
          core={coreWithToasts}
          onProvidersChanged={jest.fn()}
          initialEntries={['/settings?tab=privacy']}
        />,
      );

      // The Save button is disabled until the section is dirty, so change something first.
      // The switch is reached through its label text, not by role+name: this jest environment
      // stubs EUI's htmlIdGenerator so EVERY generated id is the literal string "generated-id",
      // which makes the switch's own `aria-labelledby` resolve to the wrong node and leaves it
      // with no accessible name. EUI puts a click handler on the label <span> precisely so it
      // behaves like a real <label>, so clicking the text toggles the switch.
      fireEvent.click(
        await screen.findByText(/allow users to override privacy mode/i),
      );
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() =>
        expect(mockService.updateAssistantSettings).toHaveBeenCalled(),
      );
      await waitFor(() => expect(heard.count()).toBe(1));
    } finally {
      heard.stop();
    }
  });

  it('does not announce anything when the privacy save fails', async () => {
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.updateAssistantSettings.mockRejectedValue(new Error('boom'));
    const heard = listenFor(ASSISTANT_SETTINGS_CHANGED_EVENT);

    try {
      render(
        <SettingsPageWithRouter
          core={coreWithToasts}
          onProvidersChanged={jest.fn()}
          initialEntries={['/settings?tab=privacy']}
        />,
      );

      fireEvent.click(
        await screen.findByText(/allow users to override privacy mode/i),
      );
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() =>
        expect(mockService.updateAssistantSettings).toHaveBeenCalled(),
      );
      expect(heard.count()).toBe(0);
    } finally {
      heard.stop();
    }
  });

  it('dispatches PROVIDERS_CHANGED_EVENT when a provider becomes the default', async () => {
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.setDefault.mockResolvedValue({ ...PROVIDER, isDefault: true });
    const heard = listenFor(PROVIDERS_CHANGED_EVENT);
    const onProvidersChanged = jest.fn();

    try {
      render(
        <SettingsPageWithRouter
          core={coreWithToasts}
          onProvidersChanged={onProvidersChanged}
        />,
      );
      await waitFor(() => expect(mockService.list).toHaveBeenCalled());

      fireEvent.click(
        await screen.findByRole('button', { name: /set as default/i }),
      );

      await waitFor(() =>
        expect(mockService.setDefault).toHaveBeenCalledWith('p1'),
      );
      await waitFor(() => expect(heard.count()).toBe(1));
      // The pre-existing prop path stays intact — the event only ADDS the reach the prop lacks.
      expect(onProvidersChanged).toHaveBeenCalled();
    } finally {
      heard.stop();
    }
  });
  it('dispatches the settings event with the SAVED document as its payload', async () => {
    // M4: listeners must be able to skip their own GET, which can still return the pre-save
    // document. The dispatch therefore has to carry what the PUT returned, not just a bare Event.
    mockService.list.mockResolvedValue([PROVIDER]);
    const saved = {
      privacyDefaultOn: true,
      privacyDefaultPerProvider: {},
      userCanOverride: false,
      fieldPolicy: [],
      conversationRetentionDays: 0,
    };
    mockService.updateAssistantSettings.mockResolvedValue(saved);
    const payloads: unknown[] = [];
    const handler = (event: Event) => {
      payloads.push((event as CustomEvent<unknown>).detail);
    };
    window.addEventListener(ASSISTANT_SETTINGS_CHANGED_EVENT, handler);

    try {
      render(
        <SettingsPageWithRouter
          core={coreWithToasts}
          onProvidersChanged={jest.fn()}
          initialEntries={['/settings?tab=privacy']}
        />,
      );
      fireEvent.click(
        await screen.findByText(/allow users to override privacy mode/i),
      );
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => expect(payloads).toHaveLength(1));
      expect(payloads[0]).toEqual(saved);
    } finally {
      window.removeEventListener(ASSISTANT_SETTINGS_CHANGED_EVENT, handler);
    }
  });

  it('dispatches the settings event after a conversation-history save too', async () => {
    // L12: the retention section writes the same settings document, so it must announce it as well
    // — otherwise a retention save would leave every mounted chat holding a stale document.
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.updateAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      privacyDefaultPerProvider: {},
      userCanOverride: true,
      fieldPolicy: [],
      conversationRetentionDays: 30,
    });
    const heard = listenFor(ASSISTANT_SETTINGS_CHANGED_EVENT);

    try {
      render(
        <SettingsPageWithRouter
          core={coreWithToasts}
          onProvidersChanged={jest.fn()}
          initialEntries={['/settings?tab=retention']}
        />,
      );
      // Queried by role, not by label: this jest environment stubs EUI's htmlIdGenerator so every
      // generated id is the literal "generated-id", which makes the field's own <label for=...>
      // resolve to whichever element carries that id first (a button). The retention days field is
      // the page's only number input, so `spinbutton` identifies it unambiguously.
      const days = await screen.findByRole('spinbutton');
      fireEvent.change(days, { target: { value: '30' } });
      fireEvent.click(
        screen.getByRole('button', {
          name: /save conversation history settings/i,
        }),
      );

      await waitFor(() =>
        expect(mockService.updateAssistantSettings).toHaveBeenCalled(),
      );
      await waitFor(() => expect(heard.count()).toBe(1));
    } finally {
      heard.stop();
    }
  });

  it('dispatches PROVIDERS_CHANGED_EVENT when a provider is created', async () => {
    mockService.list.mockResolvedValue([]);
    mockService.create.mockResolvedValue({ ...PROVIDER, name: 'Gemini lab' });
    const heard = listenFor(PROVIDERS_CHANGED_EVENT);

    try {
      render(
        <SettingsPageWithRouter
          core={coreWithToasts}
          onProvidersChanged={jest.fn()}
          autoOpenCreateForm={true}
        />,
      );
      fireEvent.change(await screen.findByLabelText(/^name/i), {
        target: { value: 'Gemini lab' },
      });
      fireEvent.change(screen.getByLabelText(/endpoint url/i), {
        target: { value: 'https://api.openai.com/v1' },
      });
      const modelField = screen.getByLabelText(/^model/i);
      fireEvent.change(modelField, { target: { value: 'gpt-4o' } });
      fireEvent.keyDown(modelField, { key: 'Enter', code: 'Enter' });
      fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

      await waitFor(() => expect(mockService.create).toHaveBeenCalled());
      await waitFor(() => expect(heard.count()).toBe(1));
    } finally {
      heard.stop();
    }
  });

  // Both delete cases go through `deleteProviderThroughRowMenu` (module scope), which carries an
  // explicit timeout and queries the modal's confirm button by its `data-test-subj`, not by
  // name — a by-name query intermittently matches the row menu's own "Delete" item as well, and
  // rendering this whole page plus a popover and a modal in jsdom overruns jest's 5 s default on
  // a loaded machine.
  it('dispatches PROVIDERS_CHANGED_EVENT when a provider is deleted', async () => {
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.remove.mockResolvedValue(undefined);
    const heard = listenFor(PROVIDERS_CHANGED_EVENT);

    try {
      render(
        <SettingsPageWithRouter
          core={coreWithToasts}
          onProvidersChanged={jest.fn()}
        />,
      );
      await deleteProviderThroughRowMenu();

      await waitFor(() =>
        expect(mockService.remove).toHaveBeenCalledWith('p1'),
      );
      await waitFor(() => expect(heard.count()).toBe(1));
    } finally {
      heard.stop();
    }
  }, 30000);

  it('does not announce a provider change when the delete fails', async () => {
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.remove.mockRejectedValue(new Error('403'));
    const heard = listenFor(PROVIDERS_CHANGED_EVENT);

    try {
      render(
        <SettingsPageWithRouter
          core={coreWithToasts}
          onProvidersChanged={jest.fn()}
        />,
      );
      await deleteProviderThroughRowMenu();

      await waitFor(() => expect(mockService.remove).toHaveBeenCalled());
      expect(heard.count()).toBe(0);
    } finally {
      heard.stop();
    }
  }, 30000);
});

/** UX wave 2, PR A: the providers table and the conversation-history field. */
describe('SettingsPage — provider table feedback and retention validation', () => {
  // The explicit timeouts on the two delete cases below are environmental, not a slow assertion:
  // rendering this whole page and driving a popover plus a modal through jsdom overruns jest's 5 s
  // default on a loaded machine, which is what makes the pre-existing delete cases in the suite
  // above flake too.
  it('confirms a provider delete with a toast naming it', async () => {
    // Delete was the only mutation on this page that just made a row vanish in silence, which
    // reads the same as a failure that closed the modal without saying anything.
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.remove.mockResolvedValue(undefined);

    render(
      <SettingsPageWithRouter
        core={coreWithToasts}
        onProvidersChanged={jest.fn()}
      />,
    );

    await deleteProviderThroughRowMenu();

    await waitFor(() =>
      expect(toasts.addSuccess).toHaveBeenCalledWith(
        'Provider "My OpenAI" deleted.',
      ),
    );
  }, 30000);

  it('says nothing on a failed delete', async () => {
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.remove.mockRejectedValue(new Error('403'));

    render(
      <SettingsPageWithRouter
        core={coreWithToasts}
        onProvidersChanged={jest.fn()}
      />,
    );

    await deleteProviderThroughRowMenu();

    await waitFor(() => expect(mockService.remove).toHaveBeenCalled());
    expect(toasts.addSuccess).not.toHaveBeenCalledWith(
      expect.stringContaining('deleted'),
    );
  }, 30000);

  it('shows a spinner and a Testing state in the Status cell while a test is in flight', async () => {
    // A test that never resolves keeps the row in the in-flight state for the assertion.
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.test.mockReturnValue(new Promise(() => undefined));

    render(
      <SettingsPageWithRouter
        core={coreWithToasts}
        onProvidersChanged={jest.fn()}
      />,
    );

    const statusChip = await screen.findByText(/testing/i);
    expect(statusChip).toBeInTheDocument();
    expect(document.querySelector('.wzStatusChip__spinner')).not.toBeNull();
  });

  it('rejects an unparseable retention value instead of clamping it to 0', async () => {
    // Clamping sent the field to 0 — the one value that means "keep everything forever" — for any
    // input the old `Number()` parse did not like.
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: {},
      fieldPolicy: [],
      conversationRetentionDays: 30,
    });

    render(
      <SettingsPageWithRouter
        core={coreWithToasts}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=retention']}
      />,
    );

    const days = await screen.findByRole('spinbutton');
    fireEvent.change(days, { target: { value: '-5' } });
    fireEvent.click(
      screen.getByRole('button', {
        name: /save conversation history settings/i,
      }),
    );

    expect(
      await screen.findByText(
        /retention must be 0 or a positive number of days/i,
      ),
    ).toBeInTheDocument();
    expect(mockService.updateAssistantSettings).not.toHaveBeenCalled();
    // The field keeps what was typed — it is not silently rewritten to 0.
    expect(days).toHaveValue(-5);
  });

  it('lets the field be transiently empty while editing, without inventing a 0', async () => {
    // Clearing the box to retype must not snap the value to 0 — that would make typing "14"
    // produce "014".
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: {},
      fieldPolicy: [],
      conversationRetentionDays: 30,
    });

    render(
      <SettingsPageWithRouter
        core={coreWithToasts}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=retention']}
      />,
    );

    const days = await screen.findByRole('spinbutton');
    fireEvent.change(days, { target: { value: '' } });
    expect(days).toHaveValue(null);
    // No error while editing — only on blur or save.
    expect(
      screen.queryByText(/retention must be 0 or a positive number of days/i),
    ).toBeNull();

    fireEvent.blur(days);
    expect(
      await screen.findByText(
        /retention must be 0 or a positive number of days/i,
      ),
    ).toBeInTheDocument();

    fireEvent.change(days, { target: { value: '14' } });
    expect(days).toHaveValue(14);
    expect(
      screen.queryByText(/retention must be 0 or a positive number of days/i),
    ).toBeNull();
  });

  it('titles a url-guard rejection on the providers card too', async () => {
    // The same mapping as the flyout's own callout. Driven here through a refused set-default,
    // simply because it is the cheapest provider mutation to fail from a test — what is being
    // asserted is that this callout and the flyout's agree on the title, so an admin never sees
    // one failure described two ways.
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.setDefault.mockRejectedValue({
      body: {
        message:
          'Provider request rejected: this host is a blocked cloud-metadata endpoint.',
      },
    });

    render(
      <SettingsPageWithRouter
        core={coreWithToasts}
        onProvidersChanged={jest.fn()}
      />,
    );

    fireEvent.click(
      await screen.findByRole('button', { name: /set as default provider/i }),
    );

    expect(await screen.findByText('Endpoint blocked')).toBeInTheDocument();
    expect(
      screen.getByText(/blocked cloud-metadata endpoint/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('keeps an unsaved retention draft when the Privacy tab is saved', async () => {
    // Both tabs stay mounted, so an admin can type a retention value, switch to Privacy, save
    // that, and come back. Resyncing the retention field from the save's own echo would throw
    // that unsaved edit away.
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: {},
      fieldPolicy: [],
      conversationRetentionDays: 30,
    });

    render(
      <SettingsPageWithRouter
        core={coreWithToasts}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=retention']}
      />,
    );

    const days = await screen.findByRole('spinbutton');
    fireEvent.change(days, { target: { value: '90' } });

    // Switch to Privacy, dirty it, save it.
    fireEvent.click(screen.getByRole('tab', { name: /privacy/i }));
    fireEvent.click(
      await screen.findByText(/allow users to override privacy mode/i),
    );
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(mockService.updateAssistantSettings).toHaveBeenCalled(),
    );

    // Back on the Conversation history tab, the draft is still the admin's. (Coming back is part of
    // the scenario, and also the only way to read the field: the inactive tab's card stays mounted
    // behind `display: none`, which takes it out of the accessibility tree.)
    fireEvent.click(screen.getByRole('tab', { name: /conversation history/i }));
    expect(await screen.findByRole('spinbutton')).toHaveValue(90);
  });

  it('keeps a retention edit made WHILE the privacy save is in flight', async () => {
    // The guard has to read the current draft, not the one the handler captured before its await:
    // the retention field is on a mounted tab and can be typed into while the request is open.
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: {},
      fieldPolicy: [],
      conversationRetentionDays: 30,
    });
    let resolveSave: () => void = () => undefined;
    mockService.updateAssistantSettings.mockImplementation(
      payload =>
        new Promise(resolve => {
          resolveSave = () => resolve(payload);
        }),
    );

    render(
      <SettingsPageWithRouter
        core={coreWithToasts}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=privacy']}
      />,
    );

    // Start the privacy save and leave it hanging.
    fireEvent.click(
      await screen.findByText(/allow users to override privacy mode/i),
    );
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() =>
      expect(mockService.updateAssistantSettings).toHaveBeenCalled(),
    );

    // Type a new retention value while it is still open.
    fireEvent.click(screen.getByRole('tab', { name: /conversation history/i }));
    const days = await screen.findByRole('spinbutton');
    fireEvent.change(days, { target: { value: '45' } });

    try {
      // Now let the save land, flushing the microtasks its `then` chain queues.
      await act(async () => {
        resolveSave();
        await Promise.resolve();
      });

      expect(screen.getByRole('spinbutton')).toHaveValue(45);
    } finally {
      // `jest.clearAllMocks()` clears calls but not implementations, and this one is set at module
      // scope — restore it so the deferred promise above cannot leak into a later case.
      mockService.updateAssistantSettings.mockImplementation(payload =>
        Promise.resolve(payload),
      );
    }
  });

  it.each([
    ['0', 0],
    ['30', 30],
    ['  7  ', 7],
  ])('parses %p as %p days', (raw, expected) => {
    expect(parseRetentionDays(raw as string)).toBe(expected);
  });

  it.each(['', '   ', '-1', '1.5', '1e3', 'abc', '0x10'])(
    'refuses %p rather than reinterpreting it',
    raw => {
      // `Number('')` is 0 and `Number('1e3')` is 1000 — neither is a value anybody typed as days.
      expect(parseRetentionDays(raw)).toBeNull();
    },
  );

  it('still saves a valid retention value', async () => {
    mockService.list.mockResolvedValue([PROVIDER]);
    mockService.getAssistantSettings.mockResolvedValue({
      privacyDefaultOn: false,
      userCanOverride: true,
      privacyDefaultPerProvider: {},
      fieldPolicy: [],
      conversationRetentionDays: 30,
    });

    render(
      <SettingsPageWithRouter
        core={coreWithToasts}
        onProvidersChanged={jest.fn()}
        initialEntries={['/settings?tab=retention']}
      />,
    );

    const days = await screen.findByRole('spinbutton');
    fireEvent.change(days, { target: { value: '0' } });
    fireEvent.click(
      screen.getByRole('button', {
        name: /save conversation history settings/i,
      }),
    );

    await waitFor(() =>
      expect(mockService.updateAssistantSettings).toHaveBeenCalledWith(
        expect.objectContaining({ conversationRetentionDays: 0 }),
      ),
    );
  });
});
