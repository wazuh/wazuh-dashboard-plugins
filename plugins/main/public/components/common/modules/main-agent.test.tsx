import React from 'react';
import { MainModuleAgent } from './main-agent';
import { AgentTabs } from '../../endpoints-summary/agent/agent-tabs';
import { fireEvent, render } from '@testing-library/react';
import { queryDataTestAttr } from '../../../../test/public/query-attr';

jest.mock('../../../react-services/reporting', () => ({
  ReportingService: {
    startVis2Png: jest.fn(),
    startConfigReport: jest.fn(),
  },
}));

jest.mock('../data-source', () => ({
  useDataSource: jest.fn().mockImplementation(() => ({
    dataSource: {},
    fetchFilters: {},
    isLoading: false,
  })),
  AlertsDataSourceRepository: jest.fn(),
  AlertsDataSource: jest.fn(),
  __esModule: true,
}));

describe('Main Agent', () => {
  let switchTab: jest.Mock;

  beforeEach(() => {
    switchTab = jest.fn();
  });

  it('should render report tab overview when section is stats', () => {
    const { container } = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.STATS}
        switchTab={switchTab}
      />,
    );

    expect(
      container.querySelector(queryDataTestAttr('report-tab-stats')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-configuration')),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-software')),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-network')),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-processes')),
    ).toBeFalsy();
  });

  it('should render report tab overview when section is configuration', () => {
    const { container } = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.CONFIGURATION}
        switchTab={switchTab}
      />,
    );

    expect(
      container.querySelector(queryDataTestAttr('report-tab-configuration')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-stats')),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-software')),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-network')),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-processes')),
    ).toBeFalsy();
  });

  it('should render report tab overview when section is software', () => {
    const { container } = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.SOFTWARE}
        switchTab={switchTab}
      />,
    );

    expect(
      container.querySelector(queryDataTestAttr('report-tab-software')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-network')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-processes')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-configuration')),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-stats')),
    ).toBeFalsy();
  });

  it('should render report tab overview when section is network', () => {
    const { container } = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.NETWORK}
        switchTab={switchTab}
      />,
    );

    expect(
      container.querySelector(queryDataTestAttr('report-tab-software')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-network')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-processes')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-configuration')),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-stats')),
    ).toBeFalsy();
  });

  it('should render report tab overview when section is processes', () => {
    const { container } = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.PROCESSES}
        switchTab={switchTab}
      />,
    );

    expect(
      container.querySelector(queryDataTestAttr('report-tab-software')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-network')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-processes')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-configuration')),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr('report-tab-stats')),
    ).toBeFalsy();
  });

  it('should be call switchTab when click on tab', () => {
    const { container } = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.SOFTWARE}
        switchTab={switchTab}
      />,
    );

    fireEvent.click(
      container.querySelector(
        queryDataTestAttr('report-tab-software'),
      ) as Element,
    );

    expect(switchTab).toHaveBeenCalledTimes(1);
    expect(switchTab).toHaveBeenCalledWith(AgentTabs.SOFTWARE);

    fireEvent.click(
      container.querySelector(
        queryDataTestAttr('report-tab-network'),
      ) as Element,
    );

    expect(switchTab).toHaveBeenCalledTimes(2);
    expect(switchTab).toHaveBeenCalledWith(AgentTabs.NETWORK);

    fireEvent.click(
      container.querySelector(
        queryDataTestAttr('report-tab-processes'),
      ) as Element,
    );

    expect(switchTab).toHaveBeenCalledTimes(3);
    expect(switchTab).toHaveBeenCalledWith(AgentTabs.PROCESSES);
  });
});
