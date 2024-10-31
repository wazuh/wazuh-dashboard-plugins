import React from 'react';
import { render, act, RenderResult } from '@testing-library/react';
import { AgentStats } from './agent-stats';
import { queryDataTestAttr } from '../../../../test/public/query-attr';
import { CSS } from '../../../../test/utils/CSS';
import { WzRequest } from '../../../react-services';

const apiReqMock = WzRequest.apiReq as jest.Mock;

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

  it('should call api with correct agent ids and endpoints', async () => {
    apiReqMock.mockReset();
    const agentId = '000';
    const agentId2 = '001';

    let rerender: RenderResult['rerender'];

    await act(async () => {
      ({ rerender } = render(<AgentStats agent={{ id: agentId }} />));
    });

    expect(apiReqMock).toHaveBeenCalledTimes(2);
    expect(apiReqMock.mock.calls[0]).toEqual([
      'GET',
      `/agents/${agentId}/stats/logcollector`,
      {},
    ]);
    expect(apiReqMock.mock.calls[1]).toEqual([
      'GET',
      `/agents/${agentId}/stats/agent`,
      {},
    ]);

    await act(async () => {
      rerender(<AgentStats agent={{ id: agentId2 }} />);
    });

    expect(apiReqMock).toHaveBeenCalledTimes(4);
    expect(apiReqMock.mock.calls[2]).toEqual([
      'GET',
      `/agents/${agentId2}/stats/logcollector`,
      {},
    ]);
    expect(apiReqMock.mock.calls[3]).toEqual([
      'GET',
      `/agents/${agentId2}/stats/agent`,
      {},
    ]);
  });
});
