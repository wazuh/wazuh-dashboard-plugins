/* eslint-disable camelcase -- Wazuh Server API responses use snake_case */
import { getListenerCertificateNames } from './get-listener-certificate-names';
import { WzRequest } from '../../react-services/wz-request';

jest.mock('../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const apiReq = WzRequest.apiReq as jest.Mock;

const nodesResponse = (...names: string[]) => ({
  data: { data: { affected_items: names.map(name => ({ name })) } },
});

const tlsResponse = (document: unknown) => ({
  data: { data: { affected_items: [document] } },
});

const listener = (node: string, sans?: unknown) => ({
  node,
  available: true,
  listener: { sans },
});

/* Answers each node's TLS request from `byNode`; an Error value rejects. */
const mockApi = (nodes: string[], byNode: Record<string, unknown>) => {
  apiReq.mockImplementation((_method: string, path: string) => {
    if (path === '/cluster/nodes') {
      return Promise.resolve(nodesResponse(...nodes));
    }

    const node = /^\/cluster\/([^/]+)\/daemons\/remoted\/tls$/.exec(path)?.[1];
    const answer = node ? byNode[decodeURIComponent(node)] : undefined;

    return answer instanceof Error
      ? Promise.reject(answer)
      : Promise.resolve(answer);
  });
};

describe('getListenerCertificateNames', () => {
  beforeEach(() => apiReq.mockReset());

  it('asks every node for its listener certificate', async () => {
    mockApi(['master', 'worker 1'], {
      master: tlsResponse(listener('master', ['master.example.com'])),
      'worker 1': tlsResponse(listener('worker 1', ['worker.example.com'])),
    });

    await getListenerCertificateNames();

    expect(apiReq).toHaveBeenCalledWith('GET', '/cluster/nodes', {});
    expect(apiReq).toHaveBeenCalledWith(
      'GET',
      '/cluster/master/daemons/remoted/tls',
      {},
    );
    expect(apiReq).toHaveBeenCalledWith(
      'GET',
      '/cluster/worker%201/daemons/remoted/tls',
      {},
    );
  });

  it('merges the names of every node without duplicates, in node order', async () => {
    mockApi(['master', 'worker'], {
      master: tlsResponse(
        listener('master', ['master.example.com', '10.0.0.5']),
      ),
      worker: tlsResponse(
        listener('worker', ['worker.example.com', '10.0.0.5']),
      ),
    });

    await expect(getListenerCertificateNames()).resolves.toEqual([
      'master.example.com',
      '10.0.0.5',
      'worker.example.com',
    ]);
  });

  it('reads a bare document as well as an affected item', async () => {
    mockApi(['master'], {
      master: { data: { data: listener('master', ['master.example.com']) } },
    });

    await expect(getListenerCertificateNames()).resolves.toEqual([
      'master.example.com',
    ]);
  });

  it('keeps the names of the other nodes when one fails', async () => {
    mockApi(['master', 'worker'], {
      master: new Error('403 Forbidden'),
      worker: tlsResponse(listener('worker', ['worker.example.com'])),
    });

    await expect(getListenerCertificateNames()).resolves.toEqual([
      'worker.example.com',
    ]);
  });

  it('skips a node without names or unable to describe its certificate', async () => {
    mockApi(['a', 'b', 'c', 'd'], {
      a: tlsResponse(listener('a')),
      b: tlsResponse({ node: 'b', available: false, reason: 'not running' }),
      c: undefined,
      d: tlsResponse(listener('d', ['d.example.com', 42])),
    });

    await expect(getListenerCertificateNames()).resolves.toEqual([
      'd.example.com',
    ]);
  });

  it('leaves out wildcard names', async () => {
    mockApi(['master'], {
      master: tlsResponse(
        listener('master', ['*.example.com', 'master.example.com']),
      ),
    });

    await expect(getListenerCertificateNames()).resolves.toEqual([
      'master.example.com',
    ]);
  });

  it('rejects when the nodes cannot be listed', async () => {
    apiReq.mockRejectedValue(new Error('403 Forbidden'));

    await expect(getListenerCertificateNames()).rejects.toThrow(
      '403 Forbidden',
    );
  });
});
