/* eslint-disable camelcase -- the Wazuh Server API reports these fields in snake_case */
import { Logger } from 'opensearch-dashboards/server';
import { CertificateValidityClient } from './certificate-validity-client';
import { ServerAPIClient } from './server-api-client';
import type { CertificateValiditySnapshot } from '../../common/certificate-validity';

const API_HOST_ID = 'manager-local';

const buildSnapshot = (
  overrides: Partial<CertificateValiditySnapshot> = {},
): CertificateValiditySnapshot => ({
  node: 'node01',
  evaluated_at: '2026-09-15T10:00:00Z',
  evaluated_at_ts: 1_789_423_200,
  listener: {
    subject: 'CN=manager-01',
    issuer: 'CN=Corp Root CA',
    sans: ['manager-01.example.com'],
    not_before: '2026-01-01T00:00:00Z',
    not_after: '2027-01-01T00:00:00Z',
    not_after_ts: 1_798_761_600,
    seconds_until_expiry: 9_338_400,
    fingerprint: 'x509-sha256:aa',
    serial: '0x1a2b',
    path: 'etc/certs/remoted.pem',
  },
  ca_bundle: {
    path: 'etc/certs/root-ca.pem',
    publication: 1_789_423_200,
    publication_vouched: true,
    content_sha256: 'abc',
    certificates_count: 1,
    serialized_bytes: 2428,
    serialized_bytes_limit: 8191,
    certificates: [
      {
        subject: 'CN=Corp Root CA',
        issuer: 'CN=Corp Root CA',
        not_before: '2026-01-01T00:00:00Z',
        not_after: '2036-01-01T00:00:00Z',
        not_after_ts: 2_082_758_400,
        seconds_until_expiry: 315_360_000,
        fingerprint: 'x509-sha256:bb',
        serial: '0x00',
        signs_active_leaf: true,
      },
    ],
  },
  ...overrides,
});

const loggerMock = () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
});

const buildClient = (request: jest.Mock) =>
  new CertificateValidityClient(
    { asInternalUser: { request } } as unknown as ServerAPIClient,
    loggerMock() as unknown as Logger,
  );

/** The shape the Server API client produces for an HTTP error response. */
const httpError = (status: number) =>
  Object.assign(new Error('Request failed'), {
    response: { status },
  });

/** The shape the Server API client produces when the request never landed. */
const transportError = (code: string) =>
  Object.assign(new Error('connect ECONNREFUSED'), { code });

describe('CertificateValidityClient.getNodeTls', () => {
  it('returns an ok outcome carrying the snapshot (S3.1)', async () => {
    const snapshot = buildSnapshot();
    const client = buildClient(
      jest.fn().mockResolvedValue({
        data: { data: { affected_items: [snapshot] } },
      }),
    );

    await expect(client.getNodeTls(API_HOST_ID, 'node01')).resolves.toEqual({
      kind: 'ok',
      node: 'node01',
      snapshot,
    });
  });

  it('accepts a bare document without the affected_items envelope (S3.1)', async () => {
    const snapshot = buildSnapshot();
    const client = buildClient(
      jest.fn().mockResolvedValue({ data: { data: snapshot } }),
    );

    const outcome = await client.getNodeTls(API_HOST_ID, 'node01');

    expect(outcome).toEqual({ kind: 'ok', node: 'node01', snapshot });
  });

  it('maps 404 to notFound, so an older manager is not a failure (S3.2)', async () => {
    const client = buildClient(jest.fn().mockRejectedValue(httpError(404)));

    await expect(client.getNodeTls(API_HOST_ID, 'node01')).resolves.toEqual({
      kind: 'notFound',
      node: 'node01',
    });
  });

  it('maps 403 to forbidden (S3.3)', async () => {
    const client = buildClient(jest.fn().mockRejectedValue(httpError(403)));

    await expect(client.getNodeTls(API_HOST_ID, 'node01')).resolves.toEqual({
      kind: 'forbidden',
      node: 'node01',
    });
  });

  it('maps the explicit unavailable state to unavailable (S3.4)', async () => {
    const client = buildClient(
      jest.fn().mockResolvedValue({
        data: {
          data: {
            affected_items: [
              {
                node: 'node01',
                state: 'unavailable',
                reason: 'remoted is down',
              },
            ],
          },
        },
      }),
    );

    await expect(client.getNodeTls(API_HOST_ID, 'node01')).resolves.toEqual({
      kind: 'unavailable',
      node: 'node01',
      reason: 'remoted is down',
    });
  });

  it('maps an error without a response to transportError (S3.5)', async () => {
    const client = buildClient(
      jest.fn().mockRejectedValue(transportError('ECONNREFUSED')),
    );

    const outcome = await client.getNodeTls(API_HOST_ID, 'node01');

    expect(outcome).toMatchObject({
      kind: 'transportError',
      node: 'node01',
      code: 'ECONNREFUSED',
    });
  });

  it.each`
    description                | body
    ${'an empty object'}       | ${{}}
    ${'a missing ca_bundle'}   | ${{ node: 'node01', listener: { seconds_until_expiry: 1 } }}
    ${'a non-array bundle'}    | ${{ node: 'node01', listener: { seconds_until_expiry: 1 }, ca_bundle: { certificates: 'nope' } }}
    ${'a missing leaf period'} | ${{ node: 'node01', listener: {}, ca_bundle: { certificates: [] } }}
  `('maps $description to malformed (S3.6)', async ({ body }) => {
    const client = buildClient(
      jest
        .fn()
        .mockResolvedValue({ data: { data: { affected_items: [body] } } }),
    );

    const outcome = await client.getNodeTls(API_HOST_ID, 'node01');

    expect(outcome.kind).toBe('malformed');
  });

  it('never throws, whatever the failure (S3.7)', async () => {
    const client = buildClient(
      jest.fn().mockRejectedValue(new Error('something unexpected')),
    );

    await expect(
      client.getNodeTls(API_HOST_ID, 'node01'),
    ).resolves.toBeDefined();
  });

  it('requests the endpoint with the node substituted', async () => {
    const request = jest.fn().mockResolvedValue({
      data: { data: { affected_items: [buildSnapshot()] } },
    });

    await buildClient(request).getNodeTls(API_HOST_ID, 'worker-02');

    expect(request).toHaveBeenCalledWith(
      'GET',
      '/cluster/worker-02/daemons/remoted/tls',
      {},
      { apiHostID: API_HOST_ID },
    );
  });
});

describe('CertificateValidityClient.getNodes', () => {
  it('reads the name field returned by /cluster/nodes', async () => {
    const request = jest.fn().mockResolvedValue({
      data: {
        data: {
          affected_items: [
            { name: 'node01', type: 'master' },
            { name: 'worker-02', type: 'worker' },
          ],
        },
      },
    });

    await expect(buildClient(request).getNodes(API_HOST_ID)).resolves.toEqual([
      'node01',
      'worker-02',
    ]);
    expect(request).toHaveBeenCalledWith(
      'GET',
      '/cluster/nodes',
      {},
      { apiHostID: API_HOST_ID },
    );
  });

  it('propagates the failure, because an unlistable cluster is not a healthy one', async () => {
    const client = buildClient(jest.fn().mockRejectedValue(httpError(500)));

    await expect(client.getNodes(API_HOST_ID)).rejects.toThrow();
  });
});
