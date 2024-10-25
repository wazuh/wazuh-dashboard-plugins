import React from 'react';
import { MainModuleAgent } from './main-agent';
import { AgentTabs } from '../../endpoints-summary/agent/agent-tabs';
import { fireEvent, render } from '@testing-library/react';
import { queryDataTestAttr } from '../../../../test/public/query-attr';

const GENERATE_REPORT_BUTTON = 'generate-report-button';
const ARIA_SELECTED = '[aria-selected="true"]';

const REPORT_TAB = {
  STATS: 'agent-tab-stats',
  CONFIGURATION: 'agent-tab-configuration',
  SOFTWARE: 'agent-tab-software',
  NETWORK: 'agent-tab-network',
  PROCESSES: 'agent-tab-processes',
};

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

  it('should render agent tab overview when section is stats', () => {
    const { container } = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.STATS}
        switchTab={switchTab}
      />,
    );

    expect(
      container.querySelector(
        queryDataTestAttr(REPORT_TAB.STATS) + ARIA_SELECTED,
      ),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.CONFIGURATION)),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.SOFTWARE)),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.NETWORK)),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.PROCESSES)),
    ).toBeFalsy();

    const generateReportButton = container.querySelector(
      queryDataTestAttr(GENERATE_REPORT_BUTTON),
    );

    expect(generateReportButton).toBeFalsy();
  });

  it('should render agent tab overview when section is configuration', () => {
    const { container } = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.CONFIGURATION}
        switchTab={switchTab}
      />,
    );

    expect(
      container.querySelector(
        queryDataTestAttr(REPORT_TAB.CONFIGURATION) + ARIA_SELECTED,
      ),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.STATS)),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.SOFTWARE)),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.NETWORK)),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.PROCESSES)),
    ).toBeFalsy();

    const generateReportButton = container.querySelector(
      queryDataTestAttr(GENERATE_REPORT_BUTTON),
    );

    expect(generateReportButton).toBeFalsy();
  });

  it('should render agent tab overview when section is software', () => {
    const { container } = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.SOFTWARE}
        switchTab={switchTab}
      />,
    );

    expect(
      container.querySelector(
        queryDataTestAttr(REPORT_TAB.SOFTWARE) + ARIA_SELECTED,
      ),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.NETWORK)),
    ).toBeTruthy();

    expect(
      container.querySelector(
        queryDataTestAttr(REPORT_TAB.NETWORK) + ARIA_SELECTED,
      ),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.PROCESSES)),
    ).toBeTruthy();

    expect(
      container.querySelector(
        queryDataTestAttr(REPORT_TAB.PROCESSES) + ARIA_SELECTED,
      ),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.CONFIGURATION)),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.STATS)),
    ).toBeFalsy();

    const generateReportButton = container.querySelector(
      queryDataTestAttr(GENERATE_REPORT_BUTTON),
    );

    expect(generateReportButton).toBeTruthy();
  });

  it('should render agent tab overview when section is network', () => {
    const { container } = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.NETWORK}
        switchTab={switchTab}
      />,
    );

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.SOFTWARE)),
    ).toBeTruthy();

    expect(
      container.querySelector(
        queryDataTestAttr(REPORT_TAB.SOFTWARE) + ARIA_SELECTED,
      ),
    ).toBeFalsy();

    expect(
      container.querySelector(
        queryDataTestAttr(REPORT_TAB.NETWORK) + ARIA_SELECTED,
      ),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.PROCESSES)),
    ).toBeTruthy();

    expect(
      container.querySelector(
        queryDataTestAttr(REPORT_TAB.PROCESSES) + ARIA_SELECTED,
      ),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.CONFIGURATION)),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.STATS)),
    ).toBeFalsy();

    const generateReportButton = container.querySelector(
      queryDataTestAttr(GENERATE_REPORT_BUTTON),
    );

    expect(generateReportButton).toBeTruthy();
  });

  it('should render agent tab overview when section is processes', () => {
    const { container } = render(
      <MainModuleAgent
        agent={{ os: { platform: 'windows' } }}
        section={AgentTabs.PROCESSES}
        switchTab={switchTab}
      />,
    );

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.SOFTWARE)),
    ).toBeTruthy();

    expect(
      container.querySelector(
        queryDataTestAttr(REPORT_TAB.SOFTWARE) + ARIA_SELECTED,
      ),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.NETWORK)),
    ).toBeTruthy();

    expect(
      container.querySelector(
        queryDataTestAttr(REPORT_TAB.NETWORK) + ARIA_SELECTED,
      ),
    ).toBeFalsy();

    expect(
      container.querySelector(
        queryDataTestAttr(REPORT_TAB.PROCESSES) + ARIA_SELECTED,
      ),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.CONFIGURATION)),
    ).toBeFalsy();

    expect(
      container.querySelector(queryDataTestAttr(REPORT_TAB.STATS)),
    ).toBeFalsy();

    const generateReportButton = container.querySelector(
      queryDataTestAttr(GENERATE_REPORT_BUTTON),
    );

    expect(generateReportButton).toBeTruthy();
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
        queryDataTestAttr(REPORT_TAB.SOFTWARE),
      ) as Element,
    );

    expect(switchTab).toHaveBeenCalledTimes(1);
    expect(switchTab).toHaveBeenCalledWith(AgentTabs.SOFTWARE);

    fireEvent.click(
      container.querySelector(queryDataTestAttr(REPORT_TAB.NETWORK)) as Element,
    );

    expect(switchTab).toHaveBeenCalledTimes(2);
    expect(switchTab).toHaveBeenCalledWith(AgentTabs.NETWORK);

    fireEvent.click(
      container.querySelector(
        queryDataTestAttr(REPORT_TAB.PROCESSES),
      ) as Element,
    );

    expect(switchTab).toHaveBeenCalledTimes(3);
    expect(switchTab).toHaveBeenCalledWith(AgentTabs.PROCESSES);
  });
});
