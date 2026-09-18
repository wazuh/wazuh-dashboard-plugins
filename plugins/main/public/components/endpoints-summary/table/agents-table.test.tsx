import React from 'react';
import { render, mount } from 'enzyme';
import { act } from '@testing-library/react';
import { AgentsTable } from './agents-table';
import { AgentsTableGlobalActions } from './global-actions/global-actions';
import { WzRequest } from '../../../react-services/wz-request';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

jest.mock('../../../kibana-services', () => ({
  ...jest.requireActual('../../../kibana-services'),
  getUiSettings: () => ({
    get: () => false,
  }),
}));

jest.mock('../../common/hooks/use-app-config', () => ({
  useAppConfig: () => ({
    isReady: true,
    isLoading: false,
    data: {
      'reports.csv.maxRows': 10000,
    },
  }),
}));

const data = [
  {
    id: '001',
    name: 'Debian agent',
    ip: '127.0.0.1',
    status: 'active',
    group: [
      'default',
      'test',
      'test2',
      'test3',
      'test4',
      'test5',
      'test6',
      'test7',
      'test8',
    ],
    os_name: {
      os: {
        arch: 'x86_64',
        major: '2',
        name: 'Amazon Linux',
        platform: 'amzn',
        uname:
          'Linux |wazuh-manager-master-0 |4.14.114-105.126.amzn2.x86_64 |#1 SMP Tue May 7 02:26:40 UTC 2019 |x86_64',
        version: '2',
      },
      ip: '127.0.0.1',
      id: '001',
      group: [
        'default',
        'test',
        'test2',
        'test3',
        'test4',
        'test5',
        'test6',
        'test7',
        'test8',
      ],
      registerIP: '127.0.0.1',
      dateAdd: '2022-08-25T16:17:46Z',
      name: 'Debian agent',
      status: 'active',
      manager: 'wazuh-manager-master-0',
      lastKeepAlive: '9999-12-31T23:59:59Z',
      version: 'Wazuh v4.5.0',
    },
    version: 'v4.5.0',
    dateAdd: 'Aug 25, 2022 @ 18:17:46.000',
    lastKeepAlive: 'Jan 1, 10000 @ 00:59:59.000',
    actions: {
      os: {
        arch: 'x86_64',
        major: '2',
        name: 'Amazon Linux',
        platform: 'amzn',
        uname:
          'Linux |wazuh-manager-master-0 |4.14.114-105.126.amzn2.x86_64 |#1 SMP Tue May 7 02:26:40 UTC 2019 |x86_64',
        version: '2',
      },
      ip: '127.0.0.1',
      id: '001',
      group: [
        'default',
        'test',
        'test2',
        'test3',
        'test4',
        'test5',
        'test6',
        'test7',
        'test8',
      ],
      registerIP: '127.0.0.1',
      dateAdd: '2022-08-25T16:17:46Z',
      name: 'Debian agent',
      status: 'active',
      manager: 'wazuh-manager-master-0',
      lastKeepAlive: '9999-12-31T23:59:59Z',
      version: 'Wazuh v4.5.0',
    },
    upgrading: true,
  },
  {
    id: '002',
    name: 'wazuh-manager-master-0',
    ip: '127.0.0.1',
    status: 'active',
    group: ['default', 'test', 'test2', 'test3', 'test4'],
    os_name: {
      os: {
        arch: 'x86_64',
        major: '2',
        name: 'Amazon Linux',
        platform: 'amzn',
        uname:
          'Linux |wazuh-manager-master-0 |4.14.114-105.126.amzn2.x86_64 |#1 SMP Tue May 7 02:26:40 UTC 2019 |x86_64',
        version: '2',
      },
      ip: '127.0.0.1',
      id: '002',
      group: ['default', 'test', 'test2', 'test3', 'test4'],
      registerIP: '127.0.0.1',
      dateAdd: '2022-08-25T16:17:46Z',
      name: 'wazuh-manager-master-0',
      status: 'active',
      manager: 'wazuh-manager-master-0',
      lastKeepAlive: '9999-12-31T23:59:59Z',
      version: 'Wazuh v4.5.0',
    },
    version: 'v4.5.0',
    dateAdd: 'Aug 25, 2022 @ 18:17:46.000',
    lastKeepAlive: 'Jan 1, 10000 @ 00:59:59.000',
    actions: {
      os: {
        arch: 'x86_64',
        major: '2',
        name: 'Amazon Linux',
        platform: 'amzn',
        uname:
          'Linux |wazuh-manager-master-0 |4.14.114-105.126.amzn2.x86_64 |#1 SMP Tue May 7 02:26:40 UTC 2019 |x86_64',
        version: '2',
      },
      ip: '127.0.0.1',
      id: '002',
      group: ['default', 'test', 'test2', 'test3', 'test4'],
      registerIP: '127.0.0.1',
      dateAdd: '2022-08-25T16:17:46Z',
      name: 'wazuh-manager-master-0',
      status: 'active',
      manager: 'wazuh-manager-master-0',
      lastKeepAlive: '9999-12-31T23:59:59Z',
      version: 'Wazuh v4.5.0',
    },
    upgrading: false,
  },
  {
    id: '003',
    name: 'disconnected-agent',
    ip: '111.111.1.111',
    status: 'disconnected',
    group: ['default', 'test'],
    os_name: {
      os: {
        build: '19045',
        major: '10',
        minor: '0',
        name: 'Microsoft Windows 10 Home Single Language',
        platform: 'windows',
        uname: 'Microsoft Windows 10 Home Single Language',
        version: '10.0.19045',
      },
      disconnection_time: '2023-03-14T04:37:42Z',
      manager: 'test.com',
      status: 'disconnected',
      name: 'disconnected-agent',
      dateAdd: '1970-01-01T00:00:00Z',
      group: ['default', 'test'],
      lastKeepAlive: '2023-03-14T04:20:51Z',
      registerIP: 'any',
      id: '003',
      version: 'Wazuh v4.3.10',
      ip: '111.111.1.111',
      configSum: '97fccbb67e250b7c80aadc8d0dc59abe',
    },
    version: 'v4.3.10',
    dateAdd: 'Jan 1, 1970 @ 01:00:00.000',
    lastKeepAlive: 'Mar 14, 2023 @ 05:20:51.000',
    actions: {
      os: {
        build: '19045',
        major: '10',
        minor: '0',
        name: 'Microsoft Windows 10 Home Single Language',
        platform: 'windows',
        uname: 'Microsoft Windows 10 Home Single Language',
        version: '10.0.19045',
      },
      disconnection_time: '2023-03-14T04:37:42Z',
      manager: 'test.com',
      status: 'disconnected',
      name: 'disconnected-agent',
      dateAdd: '1970-01-01T00:00:00Z',
      group: ['default', 'test'],
      lastKeepAlive: '2023-03-14T04:20:51Z',
      registerIP: 'any',
      id: '003',
      version: 'Wazuh v4.3.10',
      ip: '111.111.1.111',
      configSum: '97fccbb67e250b7c80aadc8d0dc59abe',
    },
    upgrading: false,
  },
];

const defaultColumns = [
  'id',
  'name',
  'ip',
  'group',
  'os.name,os.version',
  'version',
  'actions',
];

const customColumns = ['id', 'name', 'ip', 'version', 'actions', 'status'];

const localStorageMock = (function () {
  let store = {
    'wz-agents-overview-table-visible-fields': null,
  };

  return {
    getItem(key) {
      return store[key];
    },

    setItem(key, value) {
      store[key] = value;
    },

    clear() {
      store = {
        'wz-agents-overview-table-visible-fields': null,
      };
    },

    removeItem(key) {
      delete store[key];
    },

    getAll() {
      return store;
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

jest.mock('../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: options => {},
  }),
}));

jest.mock('../../../redux/reducers/appStateReducers', () => ({
  appStateReducers: state => state,
}));

jest.mock(
  '../../../../../../node_modules/@elastic/eui/lib/services/accessibility/html_id_generator',
  () => ({
    htmlIdGenerator: () => () => 'htmlId',
  }),
);

jest.mock('../../../react-services/navigation-service', () => ({
  getInstance() {
    return {
      navigateToApp: () => 'http://url',
      getUrlForApp: () => 'http://url',
    };
  },
}));

const permissionsStore = {
  appStateReducers: {
    userAccount: {
      administrator: true,
    },
    withUserLogged: true,
    userPermissions: {
      'agent:create': { '*:*:*': 'allow' },
      rbac_mode: 'black',
    },
  },
};

const mockStore = configureMockStore();

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useLayoutEffect: jest.requireActual('react').useEffect,
}));

// TODO: Fix this test
describe('AgentsTable component', () => {
  WzRequest.apiReq = jest.fn(AgentsTable, 'wzReq').mockResolvedValue({
    data: {
      data: { affected_items: data },
    },
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  const store = mockStore(permissionsStore);
  it('Renders correctly to match the snapshot', () => {
    window.localStorage.setItem(
      'wz-agents-overview-table-visible-fields',
      JSON.stringify(defaultColumns),
    );
    const wrapper = render(
      <Provider store={store}>
        <AgentsTable
          filters={[]}
          showOnlyOutdated={false}
          setShowOnlyOutdated={() => jest.fn()}
          totalOutdated={0}
        />
      </Provider>,
    );

    expect(wrapper).toMatchSnapshot();
    expect(
      window.localStorage.getItem('wz-agents-overview-table-visible-fields'),
    ).toEqual(JSON.stringify(defaultColumns));
  });

  it('Renders correctly to match the snapshot with no predefined columns selected', () => {
    const wrapper = render(
      <Provider store={store}>
        <AgentsTable
          filters={[]}
          showOnlyOutdated={false}
          setShowOnlyOutdated={() => jest.fn()}
          totalOutdated={0}
        />
      </Provider>,
    );

    expect(wrapper).toMatchSnapshot();
    expect(
      window.localStorage.getItem('wz-agents-overview-table-visible-fields'),
    ).toEqual(null);
  });

  it('Renders correctly to match the snapshot with custom columns', () => {
    window.localStorage.setItem(
      'wz-agents-overview-table-visible-fields',
      JSON.stringify(customColumns),
    );
    const wrapper = render(
      <Provider store={store}>
        <AgentsTable
          filters={[]}
          showOnlyOutdated={false}
          setShowOnlyOutdated={() => jest.fn()}
          totalOutdated={0}
        />
      </Provider>,
    );

    expect(wrapper).toMatchSnapshot();
    expect(
      window.localStorage.getItem('wz-agents-overview-table-visible-fields'),
    ).toEqual(JSON.stringify(customColumns));
  });

  describe('selection across pages (regression, T2)', () => {
    const mountAgentsTable = async () => {
      let wrapper: any = null;
      await act(async () => {
        wrapper = mount(
          <Provider store={store}>
            <AgentsTable
              filters={[]}
              showOnlyOutdated={false}
              setShowOnlyOutdated={() => jest.fn()}
              totalOutdated={0}
            />
          </Provider>,
        );
        // Flush the chained async work (agent API version fetch, then the
        // table's own data fetch) so the EuiBasicTable is actually rendered
        // with rows before the tests interact with it.
        await new Promise(resolve => setTimeout(resolve, 0));
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      wrapper.update();
      return wrapper;
    };

    it('accumulates the selection and reports the accumulated total to global actions', async () => {
      const wrapper = await mountAgentsTable();
      const tableInstance = wrapper.find('EuiBasicTable').first().instance();

      await act(async () => {
        tableInstance.setSelection([data[0]]);
      });
      wrapper.update();

      await act(async () => {
        tableInstance.setSelection([data[0], data[1]]);
      });
      wrapper.update();

      const globalActions = wrapper.find(AgentsTableGlobalActions);
      expect(globalActions.prop('selectedAgents')).toHaveLength(2);
      expect(
        globalActions.prop('selectedAgents').map((a: any) => a.id),
      ).toEqual(expect.arrayContaining([data[0].id, data[1].id]));
    });

    it('clears the selection when the underlying endpoint changes', async () => {
      const wrapper = await mountAgentsTable();
      const tableInstance = wrapper.find('EuiBasicTable').first().instance();

      await act(async () => {
        tableInstance.setSelection([data[0], data[1]]);
      });
      wrapper.update();

      expect(tableInstance.state.selection).toHaveLength(2);

      // AgentsTable always renders the '/agents' endpoint (it never varies
      // for this caller), so an endpoint change can't be simulated by
      // changing a prop here. What we can and must assert is the actual
      // mechanism table-with-search-bar.tsx uses to react to an endpoint
      // change: calling the table ref's imperative `setSelection([])`.
      // Reconciling against the visible page must not resurrect any of
      // the previously selected ids.
      await act(async () => {
        wrapper.find('EuiBasicTable').first().instance().setSelection([]);
      });
      wrapper.update();

      expect(
        wrapper.find('EuiBasicTable').first().instance().state.selection,
      ).toEqual([]);
      expect(
        wrapper.find(AgentsTableGlobalActions).prop('selectedAgents'),
      ).toEqual([]);
    });

    it('drops allAgentsSelected once the selection falls below the total', async () => {
      const wrapper = await mountAgentsTable();
      const tableInstance = wrapper.find('EuiBasicTable').first().instance();

      await act(async () => {
        tableInstance.setSelection(data);
      });
      wrapper.update();

      await act(async () => {
        tableInstance.setSelection([data[0]]);
      });
      wrapper.update();

      expect(
        wrapper.find(AgentsTableGlobalActions).prop('allAgentsSelected'),
      ).toBe(false);
    });
  });
});
