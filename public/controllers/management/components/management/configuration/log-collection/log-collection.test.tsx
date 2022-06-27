import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import WzConfigurationLogCollection from './log-collection';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

jest.mock('../../../../../../kibana-services', () => ({
  getAngularModule: jest.fn(),
  getUiSettings: () => ({
    get: (uiSetting: string) => {
      if (uiSetting === 'theme:darkMode') {
        return false;
      }
    },
  }),
}));

const mockStore = configureMockStore();
const store = mockStore({
  configurationReducers: { clusterNodeSelected: false },
});

// mocked getErrorOrchestrator
const mockedGetErrorOrchestrator = {
  handleError: jest.fn(),
};

jest.mock('../../../../../../react-services/common-services', () => {
  return {
    getErrorOrchestrator: () => mockedGetErrorOrchestrator,
  };
});

// mocked hoc withWzConfig
jest.mock('../util-hocs/wz-config', () => () => (Component) => (props) => <Component {...props} />);

// Linux Agent mocked data
const linuxCurrentConfigMocked = {
  'logcollector-localfile': {
    localfile: [
      {
        file: '/var/ossec/logs/active-responses.log',
        logformat: 'syslog',
        ignore_binaries: 'no',
        'only-future-events': 'yes',
        target: ['agent'],
      },
      {
        file: '/var/log/dpkg.log',
        logformat: 'syslog',
        ignore_binaries: 'no',
        'only-future-events': 'yes',
        target: ['agent'],
      },
      {
        logformat: 'command',
        command: 'df -P',
        alias: 'df -P',
        ignore_binaries: 'no',
        target: ['agent'],
        frequency: 360,
      },
      {
        logformat: 'full_command',
        command:
          "netstat -tulpn | sed 's/\\\\([[:alnum:]]\\\\+\\\\)\\\\ \\\\+[[:digit:]]\\\\+\\\\ \\\\+[[:digit:]]\\\\+\\\\ \\\\+\\\\(.*\\\\):\\\\([[:digit:]]*\\\\)\\\\ \\\\+\\\\([0-9\\\\.\\\\:\\\\*]\\\\+\\\\).\\\\+\\\\ \\\\([[:digit:]]*\\\\/[[:alnum:]\\\\-]*\\\\).*/\\\\1 \\\\2 == \\\\3 == \\\\4 \\\\5/' | sort -k 4 -g | sed 's/ == \\\\(.*\\\\) ==/:\\\\1/' | sed 1,2d",
        alias: 'netstat listening ports',
        ignore_binaries: 'no',
        target: ['agent'],
        frequency: 360,
      },
      {
        logformat: 'full_command',
        command: 'last -n 20',
        alias: 'last -n 20',
        ignore_binaries: 'no',
        target: ['agent'],
        frequency: 360,
      },
    ],
  },
  'logcollector-socket': {},
};

const linuxAgentMocked = {
  os: {
    arch: 'x86_64',
    codename: 'Bionic Beaver',
    major: '18',
    minor: '04',
    name: 'Ubuntu',
    platform: 'ubuntu',
    uname:
      'Linux |wazuh_agent_ubuntu_sources_cmake-v4.3.4-rc1 |5.10.104-linuxkit |#1 SMP Thu Mar 17 17:08:06 UTC 2022 |x86_64',
    version: '18.04.6 LTS',
  },
  group: ['default'],
  status: 'active',
  lastKeepAlive: '2022-06-24T14:59:11Z',
  node_name: 'master-node',
  manager: 'wazuh-manager-master-v4.3.4-rc1-7.10.2',
  mergedSum: '4a8724b20dee0124ff9656783c490c4e',
  dateAdd: '2022-06-23T15:28:03Z',
  registerIP: 'any',
  name: 'wazuh_agent_ubuntu_sources_cmake-v4.3.4-rc1',
  version: 'Wazuh v4.3.4',
  id: '001',
  ip: '172.18.0.5',
  configSum: 'ab73af41699f13fdd81903b5f23d8d00',
  agentPlatform: 'linux',
};

// Window Agent mocked data
const windowAgentMocked = {
  os: {
    build: '19043',
    major: '10',
    minor: '0',
    name: 'Microsoft Windows 10 Pro',
    platform: 'windows',
    uname: 'Microsoft Windows 10 Pro',
    version: '10.0.19043',
  },
  manager: 'wazuh-manager-master-v4.3.4-rc1-7.10.2',
  dateAdd: '2022-06-24T14:47:58Z',
  ip: '192.168.0.98',
  lastKeepAlive: '2022-06-24T16:09:20Z',
  name: 'W10-4.3',
  status: 'active',
  version: 'Wazuh v4.3.0',
  mergedSum: '4a8724b20dee0124ff9656783c490c4e',
  group: ['default'],
  id: '002',
  configSum: 'ab73af41699f13fdd81903b5f23d8d00',
  registerIP: 'any',
  node_name: 'master-node',
  agentPlatform: 'windows',
};

const windowsCurrentConfigMocked = {
  'logcollector-localfile': {
    localfile: [
      {
        channel: 'Application',
        logformat: 'eventchannel',
        ignore_binaries: 'no',
        'only-future-events': 'yes',
        target: ['agent'],
        reconnect_time: 5,
      },
      {
        channel: 'Security',
        logformat: 'eventchannel',
        query: {
          value:
            'Event/System[EventID != 5145 and EventID != 5156 and EventID != 5447 and\\n      EventID != 4656 and EventID != 4658 and EventID != 4663 and EventID != 4660 and\\n      EventID != 4670 and EventID != 4690 and EventID != 4703 and EventID != 4907 and\\n      EventID != 5152 and EventID != 5157]',
        },
        ignore_binaries: 'no',
        'only-future-events': 'yes',
        target: ['agent'],
        reconnect_time: 5,
      },
      {
        channel: 'System',
        logformat: 'eventchannel',
        ignore_binaries: 'no',
        'only-future-events': 'yes',
        target: ['agent'],
        reconnect_time: 5,
      },
      {
        file: 'active-response\\\\active-responses.log',
        logformat: 'syslog',
        ignore_binaries: 'no',
        'only-future-events': 'yes',
        target: ['agent'],
      },
    ],
  },
  'logcollector-socket': {},
};

describe('Log Collection Section', () => {
  describe('Linux Agent', () => {
    it('should render correct tabs when receive a linux agent', async () => {
      const { getByRole } = render(
        <Provider store={store}>
          <WzConfigurationLogCollection
            agent={linuxAgentMocked}
            currentConfig={linuxCurrentConfigMocked}
          />
        </Provider>
      );

      expect(getByRole('tab', { name: 'Logs' })).toBeInTheDocument();
      expect(getByRole('tab', { name: 'Commands' })).toBeInTheDocument();
      expect(() => getByRole('tab', { name: 'Windows Events' })).toThrow();
      expect(getByRole('tab', { name: 'Sockets' })).toBeInTheDocument();
    });

    it('should shows the correct panel sidebar items when "Commands" tab is selected depends on received config', () => {
      const { getByText, getByRole } = render(
        <Provider store={store}>
          <WzConfigurationLogCollection
            agent={linuxAgentMocked}
            currentConfig={linuxCurrentConfigMocked}
          />
        </Provider>
      );

      fireEvent.click(getByText('Commands'));
      getByRole('heading', { name: /command monitoring/i });
      // buttons on left sidebar, showing alias
      const localFilesWithAlias = linuxCurrentConfigMocked[
        'logcollector-localfile'
      ].localfile.filter((item) => item.alias);
      localFilesWithAlias.forEach((item) => {
        getByRole('button', { name: new RegExp(item.alias || '', 'i') });
      });
    });

    it('should shows the correct "Commands" data for each command selected', () => {
      const { getByText, getByRole, getByTestId } = render(
        <Provider store={store}>
          <WzConfigurationLogCollection
            agent={linuxAgentMocked}
            currentConfig={linuxCurrentConfigMocked}
          />
        </Provider>
      );

      fireEvent.click(getByText('Commands'));
      getByRole('heading', { name: /command monitoring/i });
      // check all sidebar buttons functionality and inputs showed
      const localFilesWithAlias = linuxCurrentConfigMocked[
        'logcollector-localfile'
      ].localfile.filter((item) => item.alias);
      localFilesWithAlias.forEach((item) => {
        const commandItem = getByRole('button', { name: new RegExp(item.alias || '', 'i') });
        fireEvent.click(commandItem);
        getByText(/log format/i);
        expect(getByTestId('log-format')).toHaveValue(item.logformat);
        getByText(/run this command/i);
        expect(getByTestId('run-this-command')).toHaveValue(item.command);
        getByText(/command alias/i);
        expect(getByTestId('command-alias')).toHaveValue(item.alias);
        getByText(/interval between command executions/i);
        expect(getByTestId('interval-between-command-executions')).toHaveValue(
          `${item.frequency?.toString()}`
        );
        getByText(/redirect output to this socket/i);
        expect(getByTestId('redirect-output-to-this-socket')).toHaveValue(`${item.target.pop()}`);
      });
    });
  });

  describe('Windows Agent', () => {
    it('should render correct tabs when receive a window agent', async () => {
      const { getByRole } = render(
        <Provider store={store}>
          <WzConfigurationLogCollection
            agent={windowAgentMocked}
            currentConfig={windowsCurrentConfigMocked}
          />
        </Provider>
      );

      expect(getByRole('tab', { name: 'Logs' })).toBeInTheDocument();
      expect(() => getByRole('tab', { name: 'Commands' })).toThrow();
      expect(getByRole('tab', { name: 'Windows Events' })).toBeInTheDocument();
      expect(getByRole('tab', { name: 'Sockets' })).toBeInTheDocument();
    });

    it('should shows the correct panel sidebar items when "Windows Events" tab is selected depends on received config', () => {
      const { getByText, getByRole } = render(
        <Provider store={store}>
          <WzConfigurationLogCollection
            agent={windowAgentMocked}
            currentConfig={windowsCurrentConfigMocked}
          />
        </Provider>
      );

      fireEvent.click(getByText('Windows Events'));
      getByRole('heading', { name: /windows events logs/i });
      // buttons on left sidebar, showing alias
      const localFilesWithChannel = windowsCurrentConfigMocked[
        'logcollector-localfile'
      ].localfile.filter((item) => item.logformat === 'eventchannel');
      localFilesWithChannel.forEach((item) => {
        const eventBtn = getByRole('button', { name: new RegExp(`${item.channel}`, 'i') });
        fireEvent.click(eventBtn);
      });
    });

    it('should shows the correct "Windows Events" data for each command selected', () => {
      const { getByText, getByRole, getByTestId } = render(
        <Provider store={store}>
          <WzConfigurationLogCollection
            agent={windowAgentMocked}
            currentConfig={windowsCurrentConfigMocked}
          />
        </Provider>
      );

      fireEvent.click(getByText('Windows Events'));
      getByRole('heading', { name: /windows events logs/i });
      // check all sidebar buttons functionality and inputs showed
      const localFilesWithChannel = windowsCurrentConfigMocked[
        'logcollector-localfile'
      ].localfile.filter((item) => item.logformat === 'eventchannel');
      localFilesWithChannel.forEach((item) => {
        const eventBtn = getByRole('button', { name: new RegExp(`${item.channel}`, 'i') });
        fireEvent.click(eventBtn);
        getByText(/log format/i);
        expect(getByTestId('log-format')).toHaveValue(item.logformat);
        getByText('Channel');
        expect(getByTestId('channel')).toHaveValue(item.channel);
        getByText(/query/i);
        expect(getByTestId('query')).toHaveValue(item.query?.value);
        getByText(/only future events/i);
        expect(getByTestId('only-future-events')).toHaveValue(item['only-future-events']);
        getByText(/reconnect time/i);
        expect(getByTestId('reconnect-time')).toHaveValue(item.reconnect_time?.toString());
      });
    });
  });
});
