// The real module pulls the whole core public bundle, Monaco included.
jest.mock('opensearch-dashboards/public', () => ({
  DEFAULT_NAV_GROUPS: { all: { id: 'all' } },
}));

jest.mock('./components/cti-feed', () => ({
  renderCtiFeedApp: jest.fn(() => () => undefined),
}));

import type {
  CoreSetup,
  PluginInitializerContext,
} from 'opensearch-dashboards/public';
import { WazuhCheckUpdatesPlugin } from './plugin';
import { renderCtiFeedApp } from './components/cti-feed';

const createPlugin = (ctiRegistrationUiEnabled: boolean) =>
  new WazuhCheckUpdatesPlugin({
    config: {
      get: () => ({
        ctiRegistrationUiEnabled,
        ctiUpsellEnabled: true,
        ctiRegistrationStatusPollIntervalSec: 30,
      }),
    },
  } as unknown as PluginInitializerContext<never>);

const createCoreSetup = (navGroupEnabled = false) => {
  const core = {
    application: { register: jest.fn() },
    chrome: {
      navGroup: {
        getNavGroupEnabled: () => navGroupEnabled,
        addNavLinksToGroup: jest.fn(),
      },
    },
    getStartServices: jest.fn().mockResolvedValue([{ coreStart: true }]),
  };
  return { core, setup: core as unknown as CoreSetup };
};

describe('WazuhCheckUpdatesPlugin public setup', () => {
  test('does not register the CTI feed app when the CTI registration UI is disabled', () => {
    const { core, setup } = createCoreSetup(true);

    createPlugin(false).setup(setup);

    expect(core.application.register).not.toHaveBeenCalled();
    expect(core.chrome.navGroup.addNavLinksToGroup).not.toHaveBeenCalled();
  });

  test('registers the CTI feed app in the Threat intelligence category', () => {
    const { core, setup } = createCoreSetup();

    createPlugin(true).setup(setup);

    expect(core.application.register).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'cti-feed',
        title: 'CTI feed',
        category: expect.objectContaining({
          id: 'wz-category-threat-intelligence',
        }),
      }),
    );
    expect(core.chrome.navGroup.addNavLinksToGroup).not.toHaveBeenCalled();
  });

  test('adds the app to the new navigation when it is enabled', () => {
    const { core, setup } = createCoreSetup(true);

    createPlugin(true).setup(setup);

    expect(core.chrome.navGroup.addNavLinksToGroup).toHaveBeenCalledWith(
      { id: 'all' },
      [
        expect.objectContaining({
          id: 'cti-feed',
          category: expect.objectContaining({
            id: 'wazuh-threat-intelligence',
          }),
        }),
      ],
    );
  });

  test('mounts the CTI feed app with the start services', async () => {
    const { core, setup } = createCoreSetup();
    createPlugin(true).setup(setup);
    const { mount } = core.application.register.mock.calls[0][0];
    const params = { element: document.createElement('div') };

    await mount(params);

    expect(renderCtiFeedApp).toHaveBeenCalledWith({ coreStart: true }, params);
  });
});
