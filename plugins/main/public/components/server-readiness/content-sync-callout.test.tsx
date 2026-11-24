/* eslint-disable camelcase -- the manager API responses are snake_case */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { WzRequest } from '../../react-services/wz-request';
import { ContentSyncCallout } from './content-sync-callout';

jest.mock('../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));
jest.mock('../../kibana-services', () => ({
  getCore: () => ({
    application: {
      getUrlForApp: (id: string) => `/app/${id}`,
      navigateToUrl: jest.fn(),
    },
  }),
}));
jest.mock(
  '../../../../../src/plugins/opensearch_dashboards_react/public',
  () => ({
    RedirectAppLinks: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  }),
);

const apiReq = WzRequest.apiReq as jest.Mock;

const nodeStatus = (standardStatus: string, available = false) => ({
  data: {
    data: {
      affected_items: [
        {
          'wazuh-manager-analysisd': {
            ready: available,
            running: true,
            spaces: {
              standard: { available, enabled: true, status: standardStatus },
            },
          },
          ready: available,
        },
      ],
    },
  },
});

const mockCluster = (statuses: Record<string, object>) =>
  apiReq.mockImplementation((_method: string, path: string) => {
    if (path === '/cluster/nodes') {
      return Promise.resolve({
        data: {
          data: {
            affected_items: Object.keys(statuses).map(name => ({ name })),
          },
        },
      });
    }
    return Promise.resolve(statuses[path.split('/')[2]]);
  });

describe('ContentSyncCallout', () => {
  afterEach(() => apiReq.mockReset());

  it('names the nodes still syncing and links to Server status', async () => {
    mockCluster({
      master: nodeStatus('updating'),
      worker: nodeStatus('ready', true),
    });
    render(<ContentSyncCallout />);
    expect(
      await screen.findByText(
        'Content sync in progress on master. New findings may be delayed.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('View details in Server status').closest('a'),
    ).toHaveAttribute('href', '/app/server-status');
  });

  it('says the sync failed when any node failed', async () => {
    mockCluster({
      master: nodeStatus('failed'),
      worker: nodeStatus('updating'),
    });
    render(<ContentSyncCallout />);
    expect(
      await screen.findByText(
        'Content sync failed on master, worker. New findings may be delayed.',
      ),
    ).toBeInTheDocument();
  });

  it('still names a syncing node when another node does not answer', async () => {
    apiReq.mockImplementation((_method: string, path: string) => {
      if (path === '/cluster/nodes') {
        return Promise.resolve({
          data: {
            data: { affected_items: [{ name: 'master' }, { name: 'worker' }] },
          },
        });
      }
      return path.includes('worker')
        ? Promise.reject(new Error('Node worker is down'))
        : Promise.resolve(nodeStatus('updating'));
    });
    render(<ContentSyncCallout />);
    expect(
      await screen.findByText(
        'Content sync in progress on master. New findings may be delayed.',
      ),
    ).toBeInTheDocument();
  });

  it('renders nothing when every node is synced', async () => {
    mockCluster({ master: nodeStatus('ready', true) });
    const { container } = render(<ContentSyncCallout />);
    await waitFor(() => expect(apiReq).toHaveBeenCalledTimes(2));
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the status cannot be read', async () => {
    apiReq.mockRejectedValue(new Error('403'));
    const { container } = render(<ContentSyncCallout />);
    await waitFor(() => expect(apiReq).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
