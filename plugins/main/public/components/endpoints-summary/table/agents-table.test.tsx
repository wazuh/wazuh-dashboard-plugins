import React from 'react';
import { render } from 'enzyme';
import { AgentsTable } from './agents-table';
import { WzRequest } from '../../../react-services/wz-request';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

const data = [
  {
    id: '001',
    name: 'Debian agent',
    ip: '127.0.0.1',
    status: 'active',
    group_config_status: 'not synced',
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
      node_name: 'master',
      lastKeepAlive: '9999-12-31T23:59:59Z',
      version: 'Wazuh v4.5.0',
      group_config_status: 'not synced',
    },
    version: 'v4.5.0',
    node_name: 'master',
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
      node_name: 'master',
      lastKeepAlive: '9999-12-31T23:59:59Z',
      version: 'Wazuh v4.5.0',
      group_config_status: 'not synced',
    },
    upgrading: true,
  },
  {
    id: '002',
    name: 'wazuh-manager-master-0',
    ip: '127.0.0.1',
    status: 'active',
    group_config_status: 'synced',
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
      node_name: 'master',
      lastKeepAlive: '9999-12-31T23:59:59Z',
      version: 'Wazuh v4.5.0',
      group_config_status: 'synced',
    },
    version: 'v4.5.0',
    node_name: 'master',
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
      node_name: 'master',
      lastKeepAlive: '9999-12-31T23:59:59Z',
      version: 'Wazuh v4.5.0',
      group_config_status: 'synced',
    },
    upgrading: false,
  },
  {
    id: '003',
    name: 'disconnected-agent',
    ip: '111.111.1.111',
    status: 'disconnected',
    group_config_status: 'not synced',
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
      node_name: 'node01',
      registerIP: 'any',
      id: '003',
      version: 'Wazuh v4.3.10',
      ip: '111.111.1.111',
      mergedSum: 'e669d89eba52f6897060fc65a45300ac',
      configSum: '97fccbb67e250b7c80aadc8d0dc59abe',
      group_config_status: 'not synced',
    },
    version: 'v4.3.10',
    node_name: 'node01',
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
      node_name: 'node01',
      registerIP: 'any',
      id: '003',
      version: 'Wazuh v4.3.10',
      ip: '111.111.1.111',
      mergedSum: 'e669d89eba52f6897060fc65a45300ac',
      configSum: '97fccbb67e250b7c80aadc8d0dc59abe',
      group_config_status: 'not synced',
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
  'node_name',
  'version',
  'actions',
  'group_config_status',
];

const customColumns = [
  'id',
  'name',
  'ip',
  'version',
  'actions',
  'status',
  'group_config_status',
];

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

jest.mock('../../../kibana-services', () => ({
  getCore: jest.fn().mockReturnValue({
    application: {
      navigateToApp: () => 'http://url',
      getUrlForApp: () => 'http://url',
    },
  }),
}));

jest.mock('../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: options => {},
  }),
}));

jest.mock('../../../redux/reducers/appStateReducers', () => ({
  appStateReducers: state => state,
}));

const permissionsStore = {
  appStateReducers: {
    withUserLogged: true,
    userRoles: ['administrator'],
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
          removeFilters={() => jest.fn()}
          wzReq={WzRequest.apiReq}
          addingNewAgent={() => jest.fn()}
          downloadCsv={() => jest.fn()}
          clickAction={() => jest.fn()}
          formatUIDate={date => jest.fn()}
          reload={() => jest.fn()}
        />
      </Provider>,
    );

    // Set table id to avoid snapshot changes
    const tableId = '__table_d203a723-1198-11ee-ab9b-75fc624fc672';
    wrapper.find('table')[0]['attribs']['id'] = tableId;

    // Set select all checkbox id to avoid snapshot changes
    const checkBoxSelectId =
      '_selection_column-checkbox_i6bf14741-d0fa-11ee-81c4-29d002524ab5';

    //Mobile
    wrapper.find('.euiCheckbox__input')[0]['attribs']['id'] = checkBoxSelectId;
    wrapper.find('.euiCheckbox__label')[0]['attribs']['for'] = checkBoxSelectId;

    //Desktop
    wrapper.find('.euiCheckbox__input')[1]['attribs']['id'] = checkBoxSelectId;

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
          removeFilters={() => jest.fn()}
          wzReq={WzRequest.apiReq}
          addingNewAgent={() => jest.fn()}
          downloadCsv={() => jest.fn()}
          clickAction={() => jest.fn()}
          formatUIDate={date => jest.fn()}
          reload={() => jest.fn()}
        />
      </Provider>,
    );

    // Set table id to avoid snapshot changes
    const tableId = '__table_d203a723-1198-11ee-ab9b-75fc624fc672';
    wrapper.find('table')[0]['attribs']['id'] = tableId;

    // Set select all checkbox id to avoid snapshot changes
    const checkBoxSelectId =
      '_selection_column-checkbox_i6bf14741-d0fa-11ee-81c4-29d002524ab5';

    //Mobile
    wrapper.find('.euiCheckbox__input')[0]['attribs']['id'] = checkBoxSelectId;
    wrapper.find('.euiCheckbox__label')[0]['attribs']['for'] = checkBoxSelectId;

    //Desktop
    wrapper.find('.euiCheckbox__input')[1]['attribs']['id'] = checkBoxSelectId;

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
          removeFilters={() => jest.fn()}
          wzReq={WzRequest.apiReq}
          addingNewAgent={() => jest.fn()}
          downloadCsv={() => jest.fn()}
          clickAction={() => jest.fn()}
          formatUIDate={date => jest.fn()}
          reload={() => jest.fn()}
        />
      </Provider>,
    );

    // Set table id to avoid snapshot changes
    const tableId = '__table_d203a723-1198-11ee-ab9b-75fc624fc672';
    wrapper.find('table')[0]['attribs']['id'] = tableId;

    // Set select all checkbox id to avoid snapshot changes
    const checkBoxSelectId =
      '_selection_column-checkbox_i6bf14741-d0fa-11ee-81c4-29d002524ab5';

    //Mobile
    wrapper.find('.euiCheckbox__input')[0]['attribs']['id'] = checkBoxSelectId;
    wrapper.find('.euiCheckbox__label')[0]['attribs']['for'] = checkBoxSelectId;

    //Desktop
    wrapper.find('.euiCheckbox__input')[1]['attribs']['id'] = checkBoxSelectId;

    expect(wrapper).toMatchSnapshot();
    expect(
      window.localStorage.getItem('wz-agents-overview-table-visible-fields'),
    ).toEqual(JSON.stringify(customColumns));
  });
});
