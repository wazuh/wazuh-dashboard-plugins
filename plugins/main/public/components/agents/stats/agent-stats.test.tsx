import React from 'react';
import { render, act, RenderResult } from '@testing-library/react';
import { AgentStats } from './agent-stats';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { CSS } from '../../../../test/utils/CSS';
import { WzRequest } from '../../../react-services';
import { AgentStatTable } from './table';

const agent000 = '000';
const agent001 = '001';

const apiReqMock = WzRequest.apiReq as jest.Mock;
const AgentStatTableMock = AgentStatTable as jest.Mock;

jest.mock('../../../react-services', () => ({
  WzRequest: {
    apiReq: jest.fn().mockResolvedValue(undefined),
  },
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
  __esModule: true,
}));

jest.mock('../prompts', () => ({
  PromptNoActiveAgentWithoutSelect: () => <></>,
  PromptAgentFeatureVersion: () => <></>,
  __esModule: true,
}));

jest.mock('../../../utils/applications', () => ({
  endpointsSummary: {
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
  it('should not render agent info ribbon', async () => {
    await act(async () => {
      const { container } = render(<AgentStats agent={{ id: '000' }} />);

      const agentInfoRibbon = container.querySelector(
        queryDataTestAttr('agent-info'),
      );
      expect(agentInfoRibbon).toBeFalsy();
    });
  });

  it('should render stats info ribbon', async () => {
    await act(async () => {
      const { container } = render(<AgentStats agent={{ id: '000' }} />);

      expect(
        container.querySelector(queryDataTestAttr('ribbon-item-status')),
      ).toBeTruthy();

      expect(
        container.querySelector(
          queryDataTestAttr('ribbon-item-buffer_enabled'),
        ),
      ).toBeTruthy();

      expect(
        container.querySelector(queryDataTestAttr('ribbon-item-msg_buffer')),
      ).toBeTruthy();

      expect(
        container.querySelector(queryDataTestAttr('ribbon-item-msg_count')),
      ).toBeTruthy();

      expect(
        container.querySelector(queryDataTestAttr('ribbon-item-msg_sent')),
      ).toBeTruthy();

      expect(
        container.querySelector(queryDataTestAttr('ribbon-item-last_ack')),
      ).toBeTruthy();

      expect(
        container.querySelector(
          queryDataTestAttr('ribbon-item-last_keepalive'),
        ),
      ).toBeTruthy();

      expect(
        container.querySelectorAll(
          queryDataTestAttr('ribbon-item-', CSS.Attribute.Substring),
        ),
      ).toHaveLength(7);
    });
  });

  it('should call api with correct agent ids and endpoints when changing agent', async () => {
    apiReqMock.mockClear();

    let rerender: RenderResult['rerender'];

    await act(async () => {
      ({ rerender } = render(<AgentStats agent={{ id: agent000 }} />));
    });

    expect(apiReqMock).toHaveBeenCalledTimes(2);
    expect(apiReqMock.mock.calls[0]).toEqual([
      'GET',
      `/agents/${agent000}/stats/logcollector`,
      {},
    ]);
    expect(apiReqMock.mock.calls[1]).toEqual([
      'GET',
      `/agents/${agent000}/stats/agent`,
      {},
    ]);

    apiReqMock.mockClear();

    await act(async () => {
      rerender(<AgentStats agent={{ id: agent001 }} />);
    });

    expect(apiReqMock).toHaveBeenCalledTimes(2);
    expect(apiReqMock.mock.calls[0]).toEqual([
      'GET',
      `/agents/${agent001}/stats/logcollector`,
      {},
    ]);
    expect(apiReqMock.mock.calls[1]).toEqual([
      'GET',
      `/agents/${agent001}/stats/agent`,
      {},
    ]);
  });

  it('should maintain column structure across multiple renders', async () => {
    AgentStatTableMock.mockClear();

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

    let rerender: RenderResult['rerender'];

    await act(async () => {
      ({ rerender } = render(<AgentStats agent={{ id: agent000 }} />));
    });

    expect(AgentStatTableMock.mock.calls[0][0].columns).toEqual(mockColumns);
    expect(AgentStatTableMock.mock.calls[1][0].columns).toEqual(mockColumns);

    AgentStatTableMock.mockClear();

    await act(async () => {
      rerender(<AgentStats agent={{ id: agent001 }} />);
    });

    expect(AgentStatTableMock.mock.calls[0][0].columns).toEqual(mockColumns);
    expect(AgentStatTableMock.mock.calls[1][0].columns).toEqual(mockColumns);
  });

  it('should apply correct titles after render and rerender', async () => {
    AgentStatTableMock.mockClear();

    const mockDataStatLogcollectorTitle = 'Global';
    const mockDataStatAgentTitle = 'Interval';

    let rerender: RenderResult['rerender'];

    await act(async () => {
      ({ rerender } = render(<AgentStats agent={{ id: agent000 }} />));
    });

    expect(AgentStatTableMock.mock.calls[0][0].title).toEqual(
      mockDataStatLogcollectorTitle,
    );
    expect(AgentStatTableMock.mock.calls[1][0].title).toEqual(
      mockDataStatAgentTitle,
    );

    AgentStatTableMock.mockClear();

    await act(async () => {
      rerender(<AgentStats agent={{ id: agent001 }} />);
    });

    expect(AgentStatTableMock.mock.calls[0][0].title).toEqual(
      mockDataStatLogcollectorTitle,
    );
    expect(AgentStatTableMock.mock.calls[1][0].title).toEqual(
      mockDataStatAgentTitle,
    );
  });

  it('should update export csv filename correctly on rerender', async () => {
    AgentStatTableMock.mockClear();

    const mockExportCSVFilename = (
      agent000: string,
      suffix: 'global' | 'interval',
    ) => `agent-stats-${agent000}-logcollector-${suffix}`;

    let rerender: RenderResult['rerender'];

    await act(async () => {
      ({ rerender } = render(<AgentStats agent={{ id: agent000 }} />));
    });

    expect(AgentStatTableMock.mock.calls[0][0].exportCSVFilename).toEqual(
      mockExportCSVFilename(agent000, 'global'),
    );
    expect(AgentStatTableMock.mock.calls[1][0].exportCSVFilename).toEqual(
      mockExportCSVFilename(agent000, 'interval'),
    );

    AgentStatTableMock.mockClear();

    await act(async () => {
      rerender(<AgentStats agent={{ id: agent001 }} />);
    });

    expect(AgentStatTableMock.mock.calls[0][0].exportCSVFilename).toEqual(
      mockExportCSVFilename(agent001, 'global'),
    );
    expect(AgentStatTableMock.mock.calls[1][0].exportCSVFilename).toEqual(
      mockExportCSVFilename(agent001, 'interval'),
    );
  });
});
