import React from 'react';
import { MainModuleAgent } from './main-agent';
import { AgentTabs } from '../../endpoints-summary/agent/agent-tabs';
import { fireEvent, render } from '@testing-library/react';
import { queryDataTestAttr } from '../../../../test/public/query-attr';

const GENERATE_REPORT_BUTTON = 'generate-report-button';
const ARIA_SELECTED = '[aria-selected="true"]';
const EXPLORE_AGENT_BUTTON = 'explore-agent-button';

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

jest.mock('react-redux', () => ({
  connect: () => Component => Component,
  __esModule: true,
}));

jest.mock('../../../react-services/navigation-service', () => ({
  getInstance: () => ({
    getPathname: () => '',
    getParams: () => new URLSearchParams(),
    renewURL: jest.fn(),
  }),
}));

describe('Main Agent', () => {
  let switchTab: jest.Mock;

  beforeEach(() => {
    switchTab = jest.fn();
  });

  describe('Agent tabs', () => {
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
    });
  });

  describe('Generate report button', () => {
    it("shouldn't render generate report button when section is stats", () => {
      const { container } = render(
        <MainModuleAgent
          agent={{ os: { platform: 'windows' } }}
          section={AgentTabs.STATS}
          switchTab={switchTab}
        />,
      );

      const generateReportButton = container.querySelector(
        queryDataTestAttr(GENERATE_REPORT_BUTTON),
      );

      expect(generateReportButton).toBeFalsy();
    });

    it("shouldn't render generate report button when section is configuration", () => {
      const { container } = render(
        <MainModuleAgent
          agent={{ os: { platform: 'windows' } }}
          section={AgentTabs.CONFIGURATION}
          switchTab={switchTab}
        />,
      );

      const generateReportButton = container.querySelector(
        queryDataTestAttr(GENERATE_REPORT_BUTTON),
      );

      expect(generateReportButton).toBeFalsy();
    });
  });

  describe('Verify the presence of the "Pinned Agent" button', () => {
    it('should render "Pinned Agent" button in tab stats', () => {
      const { container } = render(
        <MainModuleAgent
          agent={{ os: { platform: 'windows' } }}
          section={AgentTabs.STATS}
          switchTab={switchTab}
        />,
      );

      const exploreAgentButton = container.querySelector(
        queryDataTestAttr(EXPLORE_AGENT_BUTTON),
      );

      expect(exploreAgentButton).toBeTruthy();
    });
    it('should render "Pinned Agent" button in tab configuration', () => {
      const { container } = render(
        <MainModuleAgent
          agent={{ os: { platform: 'windows' } }}
          section={AgentTabs.CONFIGURATION}
          switchTab={switchTab}
        />,
      );

      const exploreAgentButton = container.querySelector(
        queryDataTestAttr(EXPLORE_AGENT_BUTTON),
      );

      expect(exploreAgentButton).toBeTruthy();
    });
  });
});
