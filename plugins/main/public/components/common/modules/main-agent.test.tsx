import React from 'react';
import { render } from 'enzyme';
import { MainModuleAgent } from './main-agent';
import { AgentTabs } from '../../endpoints-summary/agent/agent-tabs';

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
  let switchTab;

  beforeEach(() => {
    switchTab = jest.fn();
  });

  it('should render report tab overview when section is stats', () => {
    const wrapper = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.STATS}
        switchTab={switchTab}
      />,
    );

    expect(
      wrapper.find('[data-test-subj="report-tab-stats"]').html(),
    ).toBeTruthy();

    expect(
      wrapper.find('[data-test-subj="report-tab-configuration"]').html(),
    ).toBeFalsy();

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.SOFTWARE}]`).html(),
    ).toBeFalsy();

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.NETWORK}]`).html(),
    ).toBeFalsy();

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.PROCESSES}]`).html(),
    ).toBeFalsy();
  });

  it('should render report tab overview when section is configuration', () => {
    const wrapper = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.CONFIGURATION}
        switchTab={switchTab}
      />,
    );

    expect(
      wrapper.find('[data-test-subj="report-tab-configuration"]').html(),
    ).toBeTruthy();

    expect(
      wrapper.find('[data-test-subj="report-tab-stats"]').html(),
    ).toBeFalsy();

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.SOFTWARE}]`).html(),
    ).toBeFalsy();

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.NETWORK}]`).html(),
    ).toBeFalsy();

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.PROCESSES}]`).html(),
    ).toBeFalsy();
  });

  it('should render report tab overview when section is software', () => {
    const wrapper = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.SOFTWARE}
        switchTab={switchTab}
      />,
    );

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.SOFTWARE}]`).html(),
    ).toBeTruthy();

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.NETWORK}]`).html(),
    ).toBeTruthy();

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.PROCESSES}]`).html(),
    ).toBeTruthy();

    expect(
      wrapper.find('[data-test-subj="report-tab-configuration"]').html(),
    ).toBeFalsy();

    expect(
      wrapper.find('[data-test-subj="report-tab-stats"]').html(),
    ).toBeFalsy();
  });

  it('should render report tab overview when section is network', () => {
    const wrapper = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.NETWORK}
        switchTab={switchTab}
      />,
    );

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.SOFTWARE}]`).html(),
    ).toBeTruthy();

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.NETWORK}]`).html(),
    ).toBeTruthy();

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.PROCESSES}]`).html(),
    ).toBeTruthy();

    expect(
      wrapper.find('[data-test-subj="report-tab-configuration"]').html(),
    ).toBeFalsy();

    expect(
      wrapper.find('[data-test-subj="report-tab-stats"]').html(),
    ).toBeFalsy();
  });

  it('should render report tab overview when section is processes', () => {
    const wrapper = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.PROCESSES}
        switchTab={switchTab}
      />,
    );

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.SOFTWARE}]`).html(),
    ).toBeTruthy();

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.NETWORK}]`).html(),
    ).toBeTruthy();

    expect(
      wrapper.find(`[data-test-subj=report-tab-${AgentTabs.PROCESSES}]`).html(),
    ).toBeTruthy();

    expect(
      wrapper.find('[data-test-subj="report-tab-configuration"]').html(),
    ).toBeFalsy();

    expect(
      wrapper.find('[data-test-subj="report-tab-stats"]').html(),
    ).toBeFalsy();
  });
});
