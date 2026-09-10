/* eslint-disable camelcase -- the store fixture reproduces the redux state
field names verbatim. */
/*
 * The report is read by the switch, which hands it down: whether one exists
 * decides whether this page is rendered at all, so the overview only says when
 * the agent reported.
 */
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { createMemoryHistory } from 'history';

import WzConfigurationOverview from './configuration-overview';
import { getSearchableSettingsData } from './utils/settings-search-service';
import NavigationService from '../../../../../react-services/navigation-service';

jest.mock('../../../../../kibana-services', () => ({
  getUiSettings: () => ({ get: () => false }),
  getCore: () => ({ application: {} }),
  // The permissions button reaches AppState, which wants a cookie jar on import.
  getCookies: () => ({ get: () => undefined, set: () => {}, remove: () => {} }),
  setCookies: () => {},
  getWzCurrentAppID: () => 'wazuh',
}));

/* The eager fetch that powers search is not this file's concern -- covered by
settings-search-service.test.ts -- so it's mocked here to keep these tests
about the overview's own rendering/state. */
jest.mock('./utils/settings-search-service', () => ({
  getSearchableSettingsData: jest.fn().mockResolvedValue({
    values: {},
    sources: {},
  }),
  clearSettingsSearchDataCache: jest.fn(),
}));

const store = configureMockStore()({
  configurationReducers: {
    clusterNodes: false,
    clusterNodeSelected: false,
    refreshTime: false,
  },
  // The manager branch renders the permissions-gated edit button.
  appStateReducers: {
    userPermissions: {},
    userAccount: { administrator_requirements: null },
    withUserLogged: true,
  },
});

const managerStore = configureMockStore()({
  configurationReducers: {
    clusterNodes: false,
    clusterNodeSelected: 'node01',
    refreshTime: false,
  },
  appStateReducers: {
    userPermissions: {},
    userAccount: { administrator_requirements: null },
    withUserLogged: true,
  },
});

const agent = { id: '001', name: 'agent.deb.local', status: 'active' };

const renderOverview = (props = {}) =>
  render(
    <Provider store={store}>
      <WzConfigurationOverview
        updateConfigurationSection={jest.fn()}
        onRefreshAgentReport={jest.fn()}
        {...props}
      />
    </Provider>,
  );

describe('WzConfigurationOverview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // A fresh, isolated history per test -- `withRouterSearch` reads it via
    // `NavigationService`, and a real/hash history would leak query params
    // (pushed/replaced by a previous test) into the next one.
    NavigationService.getInstance(createMemoryHistory());
    (getSearchableSettingsData as jest.Mock).mockResolvedValue({
      values: {},
      sources: {},
    });
  });

  it('says how long ago the agent reported', async () => {
    renderOverview({
      agent,
      report: {
        content: {},
        modules: ['fim'],
        modifiedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
    });

    await screen.findByText(/Reported 5 minutes ago/);
  });

  it('lists the modules of an agent', async () => {
    renderOverview({ agent, report: { content: {}, modules: [] } });

    await screen.findByText('Log collection');
  });

  /* The read can fail, and the modules stay reachable so each section can
  report what went wrong. There is nothing to date the configuration with. */
  it('lists the modules without a date when there is no report', async () => {
    renderOverview({ agent });

    await screen.findByText('Log collection');
    expect(screen.queryByText(/Reported/)).not.toBeInTheDocument();
  });

  it('renders a single-property dynamic list as a table', async () => {
    (getSearchableSettingsData as jest.Mock).mockResolvedValue({
      values: {
        'integrity-monitoring.nodiff': ['/etc/passwd', '/etc/hosts'],
      },
      sources: {},
    });

    renderOverview({ agent, report: { content: {}, modules: [] } });

    fireEvent.click(
      await screen.findByRole('button', { name: /Integrity monitoring/ }),
    );

    await screen.findByText('No diff directories');
    expect(
      screen.getByRole('columnheader', { name: 'Path' }),
    ).toBeInTheDocument();
    expect(screen.getByText('/etc/passwd')).toBeInTheDocument();
    expect(screen.getByText('/etc/hosts')).toBeInTheDocument();
  });

  it('hides Windows-only sections and shows Who-data for a non-Windows agent', async () => {
    renderOverview({
      agent: { ...agent, os: { platform: 'linux' } },
      report: { content: {}, modules: [] },
    });

    fireEvent.click(
      await screen.findByRole('button', { name: /Integrity monitoring/ }),
    );
    await screen.findAllByText('Who-data audit keys');
    expect(screen.queryByText('Registries limit')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Monitored registry entries'),
    ).not.toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole('button', { name: /Log collection/ }),
    );
    expect(screen.queryByText('Windows events logs')).not.toBeInTheDocument();
  });

  it('shows Windows-only sections and hides Who-data for a Windows agent', async () => {
    renderOverview({
      agent: { ...agent, os: { platform: 'windows' } },
      report: { content: {}, modules: [] },
    });

    fireEvent.click(
      await screen.findByRole('button', { name: /Integrity monitoring/ }),
    );
    await screen.findByText('Registries limit');
    expect(screen.getByText('Monitored registry entries')).toBeInTheDocument();
    expect(screen.queryByText('Who-data audit keys')).not.toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole('button', { name: /Log collection/ }),
    );
    await screen.findByText('Windows events logs');
  });

  it('renders a multi-property dynamic list as a master-detail layout', async () => {
    (getSearchableSettingsData as jest.Mock).mockResolvedValue({
      values: {
        'commands.command': [
          { tag: 'restart-service', command: 'systemctl restart x' },
          { tag: 'clear-cache', command: 'rm -rf /cache' },
        ],
      },
      sources: {},
    });

    renderOverview({ agent, report: { content: {}, modules: [] } });

    fireEvent.click(await screen.findByRole('button', { name: /Commands/ }));

    await screen.findByText('Command definitions');
    expect(
      screen.getByRole('button', { name: 'restart-service' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'clear-cache' }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('systemctl restart x')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('rm -rf /cache')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'clear-cache' }));

    expect(screen.getByDisplayValue('rm -rf /cache')).toBeInTheDocument();
  });

  it('switches the detail pane content when a different category is selected', async () => {
    const { container } = renderOverview({
      agent,
      report: { content: {}, modules: [] },
    });

    await screen.findByText('Main configurations');
    expect(
      container.querySelector(
        '#configuration-category-global-configuration-agent',
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole('button', { name: /Communication/ }),
    );

    await waitFor(() =>
      expect(
        container.querySelector('#configuration-category-client'),
      ).toBeInTheDocument(),
    );
    expect(
      container.querySelector(
        '#configuration-category-global-configuration-agent',
      ),
    ).not.toBeInTheDocument();
  });

  it("falls back to the new context's first category when the previously selected one no longer applies", async () => {
    const { rerender } = renderOverview({
      agent,
      report: { content: {}, modules: [] },
    });

    fireEvent.click(await screen.findByRole('button', { name: /Commands/ }));
    await screen.findByText('Command definitions');

    rerender(
      <Provider store={store}>
        <WzConfigurationOverview updateConfigurationSection={jest.fn()} />
      </Provider>,
    );

    await screen.findByText('Logging settings');
    expect(screen.queryByText('Command definitions')).not.toBeInTheDocument();
  });

  it('shows an empty-state message for a category with nothing configured', async () => {
    (getSearchableSettingsData as jest.Mock).mockResolvedValue({
      values: {},
      sources: {},
    });

    const { container } = renderOverview({
      agent,
      report: { content: {}, modules: [] },
    });

    fireEvent.click(await screen.findByRole('button', { name: /Commands/ }));

    await screen.findByText('Command definitions');
    const category = container.querySelector(
      '#configuration-category-commands',
    );
    expect(
      within(category).getByText('Nothing configured yet.'),
    ).toBeInTheDocument();
  });

  it("counts only settings with a visible value in a category's badge", async () => {
    // None of Active response's 4 registry fields have a reported value here.
    // 'disabled' still renders (its render fallback always returns a
    // truthy 'enabled'/'disabled' string), so only it should count.
    (getSearchableSettingsData as jest.Mock).mockResolvedValue({
      values: {},
      sources: {},
    });

    renderOverview({ agent, report: { content: {}, modules: [] } });

    const activeResponseButton = await screen.findByRole('button', {
      name: /Active response/,
    });
    expect(within(activeResponseButton).getByText('1')).toBeInTheDocument();
  });

  it('counts only settings with a visible value in the search summary', async () => {
    (getSearchableSettingsData as jest.Mock).mockResolvedValue({
      values: {},
      sources: {},
    });

    renderOverview({ agent, report: { content: {}, modules: [] } });
    const search = await screen.findByPlaceholderText(/Search settings/);

    fireEvent.change(search, { target: { value: 'active response' } });

    await screen.findByText(/1 of \d+ settings/);
  });

  it('hides an unconfigured list entirely once a query does not match it', async () => {
    (getSearchableSettingsData as jest.Mock).mockResolvedValue({
      values: {},
      sources: {},
    });

    renderOverview({ agent, report: { content: {}, modules: [] } });
    const search = await screen.findByPlaceholderText(/Search settings/);

    fireEvent.change(search, {
      target: { value: 'a-setting-that-does-not-exist' },
    });

    await screen.findByText(/No settings match/);
    expect(
      screen.queryByText('Nothing configured yet.'),
    ).not.toBeInTheDocument();
  });

  it('says nothing about reporting for the manager', async () => {
    renderOverview({});

    await screen.findByPlaceholderText(/Search settings/);
    expect(screen.queryByText(/Reported/)).not.toBeInTheDocument();
  });

  describe('URL persistence', () => {
    it('selects the category named in the URL on mount, without needing a click', async () => {
      NavigationService.getInstance()
        .getHistory()
        .replace('/?category=commands');

      renderOverview({ agent, report: { content: {}, modules: [] } });

      await screen.findByText('Command definitions');
    });

    it('pre-fills and narrows by the search term named in the URL on mount', async () => {
      NavigationService.getInstance().getHistory().replace('/?q=Commands');

      const { container } = renderOverview({
        agent,
        report: { content: {}, modules: [] },
      });

      const search = (await screen.findByPlaceholderText(
        /Search settings/,
      )) as HTMLInputElement;
      expect(search.value).toBe('Commands');
      await waitFor(() =>
        expect(
          container.querySelector('#configuration-category-commands'),
        ).toBeInTheDocument(),
      );
    });

    it('pushes the selected category to the URL', async () => {
      renderOverview({ agent, report: { content: {}, modules: [] } });

      fireEvent.click(await screen.findByRole('button', { name: /Commands/ }));

      expect(NavigationService.getInstance().getParams().get('category')).toBe(
        'commands',
      );
    });

    it('replaces (not pushes) the search term in the URL after typing, debounced', async () => {
      renderOverview({ agent, report: { content: {}, modules: [] } });
      const search = await screen.findByPlaceholderText(/Search settings/);
      const history = NavigationService.getInstance().getHistory();
      const pushSpy = jest.spyOn(history, 'push');
      const replaceSpy = jest.spyOn(history, 'replace');

      fireEvent.change(search, { target: { value: 'checksums' } });

      await waitFor(
        () =>
          expect(NavigationService.getInstance().getParams().get('q')).toBe(
            'checksums',
          ),
        { timeout: 1000 },
      );
      expect(replaceSpy).toHaveBeenCalled();
      expect(pushSpy).not.toHaveBeenCalled();
    });

    it('removes the search term from the URL once the search box is cleared', async () => {
      renderOverview({ agent, report: { content: {}, modules: [] } });
      const search = await screen.findByPlaceholderText(/Search settings/);

      fireEvent.change(search, { target: { value: 'checksums' } });
      await waitFor(() =>
        expect(NavigationService.getInstance().getParams().get('q')).toBe(
          'checksums',
        ),
      );

      fireEvent.change(search, { target: { value: '' } });
      await waitFor(() =>
        expect(NavigationService.getInstance().getParams().has('q')).toBe(
          false,
        ),
      );
    });
  });

  describe('search', () => {
    const renderManagerOverview = (props = {}) =>
      render(
        <Provider store={managerStore}>
          <WzConfigurationOverview
            updateConfigurationSection={jest.fn()}
            {...props}
          />
        </Provider>,
      );

    it('fetches again once the cluster node becomes known after mount', async () => {
      /* Regression: the overview mounts before cluster node discovery
      finishes -- clusterNodeSelected starts `false` and becomes the node
      name shortly after. That transition must trigger a fetch too, not
      just switching between two already-known nodes (which is all
      withWzConfig's own reload condition needs to handle, since its
      sections never mount before a node is already selected). */
      const noNodeYetStore = configureMockStore()({
        configurationReducers: {
          clusterNodes: false,
          clusterNodeSelected: false,
          refreshTime: false,
        },
        appStateReducers: {
          userPermissions: {},
          userAccount: { administrator_requirements: null },
          withUserLogged: true,
        },
      });

      const { rerender } = render(
        <Provider store={noNodeYetStore}>
          <WzConfigurationOverview updateConfigurationSection={jest.fn()} />
        </Provider>,
      );

      await screen.findByPlaceholderText(/Search settings/);
      expect(getSearchableSettingsData).not.toHaveBeenCalled();

      rerender(
        <Provider store={managerStore}>
          <WzConfigurationOverview updateConfigurationSection={jest.fn()} />
        </Provider>,
      );

      await waitFor(() =>
        expect(getSearchableSettingsData).toHaveBeenCalledWith(
          'node01',
          'node01',
          expect.any(Array),
          expect.any(Function),
        ),
      );
    });

    it('fetches searchable settings data on mount', async () => {
      renderManagerOverview();

      await screen.findByPlaceholderText(/Search settings/);

      expect(getSearchableSettingsData).toHaveBeenCalledWith(
        'node01',
        'node01',
        expect.any(Array),
        expect.any(Function),
      );
    });

    it('shows the grouped table when the query is empty', async () => {
      const { container } = renderManagerOverview();

      await screen.findByText('Main configurations');
      const category = container.querySelector(
        '#configuration-category-global-configuration',
      );
      expect(
        within(category).getByText('Global Configuration'),
      ).toBeInTheDocument();
    });

    it('groups a section with tabs into subsections, each with its own fields', async () => {
      (getSearchableSettingsData as jest.Mock).mockResolvedValue({
        values: {
          'global-configuration.logging.log_format': 'plain',
          'global-configuration.remote.https.port': '1517',
        },
        sources: {},
      });

      renderManagerOverview();

      // The Global tab splits into two separately-headed/helped groups.
      await screen.findByText('Logging settings');
      expect(screen.getByText('HTTPS settings')).toBeInTheDocument();
      expect(screen.getByDisplayValue('plain')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1517')).toBeInTheDocument();
    });

    it('renders a help popover for a section/tab that has one but not one that has none', async () => {
      (getSearchableSettingsData as jest.Mock).mockResolvedValue({
        values: {
          'registration-service.port': 1515,
          'registration-service.ssl.ssl_manager_ca': '/path/to/ca',
        },
        sources: {},
      });

      const { container } = renderManagerOverview();

      fireEvent.click(
        await screen.findByRole('button', { name: /Registration Service/ }),
      );

      const category = container.querySelector(
        '#configuration-category-registration-service',
      );
      // "Main settings" carries help links; "SSL settings" does not.
      const mainSettingsHeader = within(category)
        .getByText('Main settings')
        .closest('.euiFlexGroup');
      const sslSettingsHeader = within(category)
        .getByText('SSL settings')
        .closest('.euiFlexGroup');
      expect(
        mainSettingsHeader.querySelector(
          '[data-euiicon-type="questionInCircle"]',
        ),
      ).toBeTruthy();
      expect(
        sslSettingsHeader.querySelector(
          '[data-euiicon-type="questionInCircle"]',
        ),
      ).toBeFalsy();
    });

    it('renders an info tooltip for a field that has one', async () => {
      (getSearchableSettingsData as jest.Mock).mockResolvedValue({
        values: { 'registration-service.force.key_mismatch': true },
        sources: {},
      });

      renderManagerOverview();

      fireEvent.click(
        await screen.findByRole('button', { name: /Registration Service/ }),
      );

      const label = await screen.findByText('Re-register only on key mismatch');
      expect(
        label
          .closest('.euiTextAlign')
          .querySelector('[data-euiicon-type="iInCircle"]'),
      ).toBeTruthy();
    });

    it('narrows the rail and detail pane to matching settings, keeping the same layout', async () => {
      (getSearchableSettingsData as jest.Mock).mockResolvedValue({
        values: { 'registration-service.port': 1515 },
        sources: {},
      });

      renderManagerOverview();
      const search = await screen.findByPlaceholderText(/Search settings/);

      fireEvent.change(search, { target: { value: 'Listen to connections' } });

      await screen.findByText('Listen to connections at port');
      expect(screen.getByDisplayValue('1515')).toBeInTheDocument();
      // Same rail + detail layout, just narrowed -- not a different view.
      expect(screen.getByText('Main configurations')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Registration Service/ }),
      ).toBeInTheDocument();
      expect(screen.queryByText('Cluster')).not.toBeInTheDocument();
    });

    it('finds a dynamic list by an item value absent from the list title/description', async () => {
      (getSearchableSettingsData as jest.Mock).mockResolvedValue({
        values: {
          'integrity-monitoring.directories': [
            { dir: '/etc', opts: ['check_all'] },
            { dir: '/var/log', opts: [] },
          ],
        },
        sources: {},
      });

      renderOverview({ agent, report: { content: {}, modules: [] } });
      const search = await screen.findByPlaceholderText(/Search settings/);

      fireEvent.change(search, { target: { value: '/etc' } });

      await screen.findByText('Monitored directories');
      expect(screen.getByRole('button', { name: '/etc' })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: '/var/log' }),
      ).not.toBeInTheDocument();
    });

    it('finds a dynamic list item by its rendered field value', async () => {
      (getSearchableSettingsData as jest.Mock).mockResolvedValue({
        values: {
          'integrity-monitoring.directories': [
            { dir: '/etc', opts: ['check_all'] },
            { dir: '/var/log', opts: [] },
          ],
        },
        sources: {},
      });

      renderOverview({ agent, report: { content: {}, modules: [] } });
      const search = await screen.findByPlaceholderText(/Search settings/);

      // '/var/log' has no `opts` enabled, so every opts-derived field on it
      // renders 'no' -- only '/etc' (with `check_all`) has a field rendering
      // 'yes', proving the match is on the *rendered* value, not the raw array.
      fireEvent.change(search, { target: { value: 'yes' } });

      await screen.findByText('Monitored directories');
      expect(screen.getByRole('button', { name: '/etc' })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: '/var/log' }),
      ).not.toBeInTheDocument();
    });

    it('restores the grouped table when the query is cleared', async () => {
      const { container } = renderManagerOverview();
      const search = await screen.findByPlaceholderText(/Search settings/);

      fireEvent.change(search, { target: { value: 'port' } });
      fireEvent.change(search, { target: { value: '' } });

      await screen.findByText('Main configurations');
      expect(
        container.querySelector('#configuration-category-global-configuration'),
      ).toBeInTheDocument();
    });

    it('shows an empty state when nothing matches the query', async () => {
      renderManagerOverview();
      const search = await screen.findByPlaceholderText(/Search settings/);

      fireEvent.change(search, {
        target: { value: 'a-setting-that-does-not-exist' },
      });

      await screen.findByText(/No settings match/);
    });
  });
});
