import path from 'path';
import fs from 'fs';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
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
  getSettingsAccess: jest.fn().mockResolvedValue({
    managerSessionOk: true,
    message: null,
    defaultApiHostId: 'default',
    apiKeyEncryptionEnabled: true,
  }),
  updateAssistantSettings: jest.fn().mockResolvedValue({}),
};

jest.mock('../../services/settings-service', () => ({
  SettingsService: jest.fn(() => mockService),
}));

import { SettingsPage } from './settings-page';
import { CoreStart } from '../../../../../src/core/public';

const coreMock = { http: {} } as unknown as CoreStart;

/**
 * `SettingsPage` reads the active tab off the URL via `useLocation`/`useHistory` (UX iteration 4
 * item 2), which requires an ambient `<Router>` — in the real app that's application.tsx's own
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

describe('SettingsPage — wazuh_brain hidden from provider type choices', () => {
  it('does not offer wazuh_brain among the provider type cards when the form is open', async () => {
    render(<SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />);

    const addButton = await screen.findByRole('button', {
      name: /add provider/i,
    });
    fireEvent.click(addButton);

    // Wait for the form to be visible (Name field is present)
    await screen.findByLabelText(/^name/i);

    // Provider type (UX iteration 4 item 1) is an EuiButtonGroup of two options, each backed by
    // a hidden native radio input — assert on those directly rather than on <option> elements.
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

    render(<SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />);

    await waitFor(() => {
      expect(mockService.test).toHaveBeenCalledWith('p1');
    });
  });

  it('does not call service.test when there are no providers', async () => {
    render(<SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />);

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

    render(<SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />);

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

    render(<SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />);

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
});

describe('SettingsPage — settings-access probe', () => {
  it('fails open (page usable, nothing blocked) when the settings-access probe itself fails', async () => {
    mockService.getSettingsAccess.mockRejectedValue(new Error('network error'));

    render(<SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />);

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
    render(<SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />);

    await screen.findByRole('button', { name: /add provider/i });
    expect(screen.queryByLabelText(/^name\s*\*?$/i)).not.toBeInTheDocument();
  });

  // RC2 (issue #8827 review): the URL only ever reflected a deep link INTO the create flow —
  // opening the same flyout from the page's own "Add provider" button left `?addProvider=true`
  // out of the address bar entirely, so the state wasn't shareable/bookmarkable/refresh-safe.
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

describe('SettingsPage — settings tabs (UX iteration 4 item 2)', () => {
  it('renders the three tabs, Providers selected by default', async () => {
    render(<SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />);

    const providersTab = await screen.findByRole('tab', { name: /^providers$/i });
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
    expect(
      screen.queryByText(/enable privacy mode by default/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/keep saved conversations for/i),
    ).not.toBeInTheDocument();
  });

  it('switches which card is shown when a tab is clicked, and updates the URL', async () => {
    render(<SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />);

    await screen.findByRole('button', { name: /add provider/i });

    fireEvent.click(
      screen.getByRole('tab', { name: /privacy & data protection/i }),
    );
    expect(
      await screen.findByText(/enable privacy mode by default/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /add a provider/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('tab', { name: /conversation history/i }),
    );
    expect(
      await screen.findByText(/keep saved conversations for/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/enable privacy mode by default/i),
    ).not.toBeInTheDocument();
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
    expect(
      screen.getByRole('tab', { name: /^providers$/i }),
    ).toHaveAttribute('aria-selected', 'true');
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
});

/**
 * Layout/hierarchy fixes from the live CSS audit (AI/ux-iter3/css-audit-full.md §4). The page's
 * 1200px measure was measured as CORRECT ("do not narrow it and do not widen it") — the void had
 * moved INSIDE the two form cards, and the hierarchy had inverted at the section tier.
 *
 * jsdom computes no layout, so the DOM tests below pin the STRUCTURE the fixes rest on and the
 * stylesheet tests pin the declarations, the same split chat-page.test.tsx uses for its grid.
 */
describe('SettingsPage — in-card layout and hierarchy (audit §4)', () => {
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
  it('lays the privacy controls and the field policy out as two columns', async () => {
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

    // One flex row holding both: the switches in the first item, the field-policy editor in the
    // second. Left as EUI's responsive default (this file's other flex rows pass
    // `responsive={false}`), so a narrow window stacks the two columns instead of squeezing them.
    const row = switchCaption.closest('.euiFlexGroup') as HTMLElement;
    expect(row).not.toBeNull();
    expect(row.textContent).toContain('Field policy');
    expect(row.className).toMatch(/responsive/i);
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
    // Both cards' Save buttons read the same `fill={!disabled}` expression, but each now lives on
    // its own tab (UX iteration 4 item 2), so this switches tabs between the two halves of the
    // assertion instead of finding both buttons in one render.
    render(<SettingsPageWithRouter core={coreMock} onProvidersChanged={jest.fn()} />);

    fireEvent.click(
      screen.getByRole('tab', { name: /conversation history/i }),
    );
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
    const privacySave = await screen.findByRole('button', {
      name: /save privacy settings/i,
    });
    expect(privacySave).toBeDisabled();
    expect(privacySave.className).not.toMatch(/fill/i);
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
