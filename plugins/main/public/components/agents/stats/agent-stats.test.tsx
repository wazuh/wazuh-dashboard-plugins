import React from 'react';
import { render, act, RenderResult } from '@testing-library/react';
import { AgentStats } from './agent-stats';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { CSS } from '../../../../test/utils/CSS';
import { useDataSource } from '../../common/data-source';
import { AgentStatTable } from './table';

const agent002 = '002';
const agent001 = '001';

// The component enforces a minimum loading duration (real setTimeout) so the
// progress bar has time to paint before swapping views -- fake timers let the
// tests fast-forward through it deterministically instead of waiting for real time.
const MIN_LOADING_DURATION_MS = 400;

const useDataSourceMock = useDataSource as jest.Mock;
const AgentStatTableMock = AgentStatTable as jest.Mock;

const statisticsResponse = (statistics: any) => ({
  hits: { hits: [{ _source: { wazuh: { agent: { statistics } } } }] },
});

const noDocumentResponse = { hits: { hits: [] } };

// Default: an empty-but-present statistics document (not "no data at all" -- see
// `noDocumentResponse` for that case), so every test below exercises the normal
// ribbon/table rendering unless it opts into a specific fixture.
const fetchDataMock = jest.fn().mockResolvedValue(statisticsResponse({}));

jest.mock('../../common/data-source', () => ({
  useDataSource: jest.fn(),
  AgentStatsDataSource: jest.fn(),
  AgentStatsDataSourceRepository: jest.fn(),
  __esModule: true,
}));

jest.mock('../../../react-services', () => ({
  formatUIDate: (date: string) => `formatted-${date}`,
}));

jest.mock('redux', () => ({
  compose: () => (Component: React.JSX.Element) => Component,
  __esModule: true,
}));

jest.mock('../../common/hocs', () => ({
  withGlobalBreadcrumb: () => () => <></>,
  withGuard: () => () => <></>,
  withUserAuthorizationPrompt: () => () => <></>,
  withErrorBoundary: () => () => <></>,
  withDataSourceInitiated: () => (Component: React.JSX.Element) => Component,
  __esModule: true,
}));

jest.mock('../prompts', () => ({
  PromptNoActiveAgentWithoutSelect: () => <></>,
  PromptAgentFeatureVersion: () => <></>,
  __esModule: true,
}));

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  __esModule: true,
}));

jest.mock('../../../redux/actions/appStateActions', () => ({
  showExploreAgentModalGlobal: (value: boolean) => ({
    type: 'SHOW_EXPLORE_AGENT_MODAL_GLOBAL',
    payload: value,
  }),
}));

jest.mock('../../../utils/applications', () => ({
  endpointSummary: {
    id: 'endpoints-summary',
    breadcrumbLabel: 'Endpoints',
  },
}));

jest.mock('../../../react-services/navigation-service', () => ({
  getInstance: () => ({
    getUrlForApp: jest.fn().mockReturnValue('http://url'),
    __esModule: true,
  }),
}));

jest.mock('./table', () => ({
  AgentStatTable: jest.fn(() => <></>),
}));

describe('AgentStats', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    fetchDataMock.mockClear();
    fetchDataMock.mockResolvedValue(statisticsResponse({}));
    AgentStatTableMock.mockClear();
    useDataSourceMock.mockReturnValue({
      isLoading: false,
      fetchData: fetchDataMock,
      fetchFilters: [],
      dataSource: {},
      error: null,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Renders/re-renders and then fast-forwards past the minimum loading duration,
  // so the assertions run against the settled (post-fetch) view.
  const renderAndSettle = async (agent: { id: string }) => {
    let result: RenderResult;
    await act(async () => {
      result = render(<AgentStats agent={agent} />);
    });
    await act(async () => {
      jest.advanceTimersByTime(MIN_LOADING_DURATION_MS);
    });
    return result!;
  };

  const rerenderAndSettle = async (
    rerender: RenderResult['rerender'],
    agent: { id: string },
  ) => {
    await act(async () => {
      rerender(<AgentStats agent={agent} />);
    });
    await act(async () => {
      jest.advanceTimersByTime(MIN_LOADING_DURATION_MS);
    });
  };

  it('should not render agent info ribbon', async () => {
    const { container } = await renderAndSettle({ id: '002' });

    const agentInfoRibbon = container.querySelector(
      queryDataTestAttr('agent-info'),
    );
    expect(agentInfoRibbon).toBeFalsy();
  });

  it('should render stats info ribbon', async () => {
    const { container } = await renderAndSettle({ id: '002' });

    expect(
      container.querySelector(queryDataTestAttr('ribbon-item-status')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('ribbon-item-messages_count')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('ribbon-item-last_keepalive')),
    ).toBeTruthy();

    expect(
      container.querySelector(
        queryDataTestAttr('ribbon-item-tasks_dispatched'),
      ),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('ribbon-item-tasks_failed')),
    ).toBeTruthy();

    expect(
      container.querySelectorAll(
        queryDataTestAttr('ribbon-item-', CSS.Attribute.Substring),
      ),
    ).toHaveLength(5);
  });

  it('should query the agent statistics index scoped to the agent', async () => {
    const { rerender } = await renderAndSettle({ id: agent002 });

    expect(fetchDataMock).toHaveBeenCalledTimes(1);
    expect(fetchDataMock.mock.calls[0][0]).toEqual({
      query: {
        language: 'kuery',
        query: `wazuh.agent.id: "${agent002}"`,
      },
      pagination: { pageIndex: 0, pageSize: 1 },
    });

    fetchDataMock.mockClear();

    await rerenderAndSettle(rerender, { id: agent001 });

    expect(fetchDataMock).toHaveBeenCalledTimes(1);
    expect(fetchDataMock.mock.calls[0][0].query.query).toEqual(
      `wazuh.agent.id: "${agent001}"`,
    );
  });

  it('should not query the index while the data source is loading', async () => {
    useDataSourceMock.mockReturnValue({
      isLoading: true,
      fetchData: fetchDataMock,
      fetchFilters: [],
      dataSource: undefined,
      error: null,
    });

    await renderAndSettle({ id: agent002 });

    expect(fetchDataMock).not.toHaveBeenCalled();
  });

  it('should render the agent statistics of the indexed document', async () => {
    fetchDataMock.mockResolvedValue(
      statisticsResponse({
        agent: {
          status: 'connected',
          last_keepalive: '2026-08-02T10:06:50Z',
          messages: { count: 12543 },
          tasks: {
            dispatched: { total: 4820 },
            failed: { total: 3 },
          },
        },
      }),
    );

    const { container } = await renderAndSettle({ id: agent002 });

    const ribbonItemValue = (key: string) =>
      container.querySelector(queryDataTestAttr(`ribbon-item-${key}`))
        ?.textContent;

    expect(ribbonItemValue('status')).toContain('connected');
    expect(ribbonItemValue('messages_count')).toContain('12,543');
    expect(ribbonItemValue('last_keepalive')).toContain(
      'formatted-2026-08-02T10:06:50Z',
    );
    expect(ribbonItemValue('tasks_dispatched')).toContain('4,820');
    expect(ribbonItemValue('tasks_failed')).toContain('3');
  });

  it('should show an empty state instead of the ribbon/tables when the agent has no statistics document', async () => {
    fetchDataMock.mockResolvedValue(noDocumentResponse);

    const { container } = await renderAndSettle({ id: agent002 });

    expect(
      container.querySelectorAll(
        queryDataTestAttr('ribbon-item-', CSS.Attribute.Substring),
      ),
    ).toHaveLength(0);
    expect(container.textContent).toContain('No statistics reported');
  });

  it('should render - in the stats without value', async () => {
    const { container } = await renderAndSettle({ id: agent002 });

    expect(
      container.querySelector(queryDataTestAttr('ribbon-item-status'))
        ?.textContent,
    ).toContain('-');
  });

  it('should maintain column structure across multiple renders, either when changing agent or not', async () => {
    const mockColumns = [
      {
        field: 'location',
        name: 'Location',
        sortable: true,
      },
      {
        field: 'events',
        name: 'Events',
        sortable: true,
      },
      {
        field: 'bytes',
        name: 'Bytes',
        sortable: true,
      },
    ];

    const { rerender } = await renderAndSettle({ id: agent002 });

    expect(AgentStatTableMock.mock.calls[0][0].columns).toEqual(mockColumns);
    expect(AgentStatTableMock.mock.calls[1][0].columns).toEqual(mockColumns);

    AgentStatTableMock.mockClear();

    await rerenderAndSettle(rerender, { id: agent001 });

    expect(AgentStatTableMock.mock.calls[0][0].columns).toEqual(mockColumns);
    expect(AgentStatTableMock.mock.calls[1][0].columns).toEqual(mockColumns);
  });

  it('should apply correct titles after render and rerender, either when changing agent or not', async () => {
    const mockDataStatLogcollectorTitle = 'Global';
    const mockDataStatAgentTitle = 'Interval';

    const { rerender } = await renderAndSettle({ id: agent002 });

    expect(AgentStatTableMock.mock.calls[0][0].title).toEqual(
      mockDataStatLogcollectorTitle,
    );
    expect(AgentStatTableMock.mock.calls[1][0].title).toEqual(
      mockDataStatAgentTitle,
    );

    AgentStatTableMock.mockClear();

    await rerenderAndSettle(rerender, { id: agent001 });

    expect(AgentStatTableMock.mock.calls[0][0].title).toEqual(
      mockDataStatLogcollectorTitle,
    );
    expect(AgentStatTableMock.mock.calls[1][0].title).toEqual(
      mockDataStatAgentTitle,
    );
  });

  it('should feed the logcollector tables with the statistics of the indexed document', async () => {
    const globalFiles = [{ location: 'df -P', events: 32, bytes: 3436 }];
    const intervalFiles = [{ location: 'df -P', events: 0, bytes: 0 }];

    fetchDataMock.mockResolvedValue(
      statisticsResponse({
        logcollector: {
          global: {
            start: '2026-08-02T09:43:50Z',
            end: '2026-08-02T10:06:50Z',
            files: globalFiles,
          },
          interval: {
            start: '2026-08-02T10:06:50Z',
            end: '2026-08-02T10:07:50Z',
            files: intervalFiles,
          },
        },
      }),
    );

    await renderAndSettle({ id: agent002 });

    const lastCallProps = (title: string) =>
      AgentStatTableMock.mock.calls
        .map(([props]) => props)
        .filter(props => props.title === title)
        .pop();

    expect(lastCallProps('Global')).toMatchObject({
      start: '2026-08-02T09:43:50Z',
      end: '2026-08-02T10:06:50Z',
      items: globalFiles,
    });
    expect(lastCallProps('Interval')).toMatchObject({
      start: '2026-08-02T10:06:50Z',
      end: '2026-08-02T10:07:50Z',
      items: intervalFiles,
    });
  });

  it('should feed the logcollector tables when a window carries a single file as an object', async () => {
    const globalFile = { location: 'df -P', events: 32, bytes: 3436 };

    fetchDataMock.mockResolvedValue(
      statisticsResponse({
        logcollector: {
          global: { start: 'start', end: 'end', files: globalFile },
        },
      }),
    );

    await renderAndSettle({ id: agent002 });

    const globalProps = AgentStatTableMock.mock.calls
      .map(([props]) => props)
      .filter(props => props.title === 'Global')
      .pop();

    expect(globalProps.items).toEqual([globalFile]);
  });

  it('should update export csv filename correctly when changing agent', async () => {
    const mockExportCSVFilename = (
      agentID: string,
      suffix: 'global' | 'interval',
    ) => `agent-stats-${agentID}-logcollector-${suffix}`;

    // The previous agent's view stays rendered while the new one loads (by
    // design, to avoid flickering), so intermediate calls can still carry the
    // outgoing agent's filename -- only the last call per table is guaranteed
    // to reflect the agent that ends up settled.
    const lastExportCSVFilename = (title: string) =>
      AgentStatTableMock.mock.calls
        .map(([props]) => props)
        .filter(props => props.title === title)
        .pop()?.exportCSVFilename;

    const { rerender } = await renderAndSettle({ id: agent002 });

    expect(lastExportCSVFilename('Global')).toEqual(
      mockExportCSVFilename(agent002, 'global'),
    );
    expect(lastExportCSVFilename('Interval')).toEqual(
      mockExportCSVFilename(agent002, 'interval'),
    );

    AgentStatTableMock.mockClear();

    await rerenderAndSettle(rerender, { id: agent001 });

    expect(lastExportCSVFilename('Global')).toEqual(
      mockExportCSVFilename(agent001, 'global'),
    );
    expect(lastExportCSVFilename('Interval')).toEqual(
      mockExportCSVFilename(agent001, 'interval'),
    );
  });
});
