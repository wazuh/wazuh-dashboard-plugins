/* eslint-disable camelcase -- the Wazuh Server API reports these fields in snake_case */
import type {
  CertificateValidityOutcome,
  CertificateValiditySnapshot,
} from '../../../wazuh-core/common/certificate-validity';
import type { InitializationTaskRunContext } from './types';
import {
  CertificateValidityServices,
  initializationTaskCreatorCertificateValidity,
} from './certificate-validity';

const DAY = 24 * 60 * 60;
const TASK_NAME = 'server-api:certificate-validity';

const snapshot = (
  node: string,
  secondsUntilExpiry: number,
): CertificateValiditySnapshot => ({
  node,
  evaluated_at: '2026-09-15T10:00:00Z',
  evaluated_at_ts: 1_789_423_200,
  listener: {
    subject: 'CN=manager-01',
    issuer: 'CN=Corp Root CA',
    sans: ['manager-01.example.com'],
    not_before: '2026-01-01T00:00:00Z',
    not_after: '2026-10-01T00:00:00Z',
    not_after_ts: 1_798_761_600,
    seconds_until_expiry: secondsUntilExpiry,
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
        seconds_until_expiry: 3650 * DAY,
        fingerprint: 'x509-sha256:bb',
        serial: '0x00',
        signs_active_leaf: true,
      },
    ],
  },
});

const buildContext = () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  context: {},
});

const buildServices = ({
  nodes = ['node01'],
  outcomes = {} as Record<string, CertificateValidityOutcome>,
  hosts = [{ id: 'manager-local' }],
  getNodes,
}: {
  nodes?: string[];
  outcomes?: Record<string, CertificateValidityOutcome>;
  hosts?: { id: string }[] | { id: string };
  getNodes?: jest.Mock;
} = {}) => ({
  manageHosts: { get: jest.fn().mockResolvedValue(hosts) },
  certificateValidityClient: {
    getNodes: getNodes ?? jest.fn().mockResolvedValue(nodes),
    getNodeTls: jest
      .fn()
      .mockImplementation((_apiHostID: string, node: string) =>
        Promise.resolve(
          outcomes[node] ?? {
            kind: 'ok',
            node,
            snapshot: snapshot(node, 3650 * DAY),
          },
        ),
      ),
  },
});

type Services = ReturnType<typeof buildServices>;

const asContract = (services: Services) =>
  services as unknown as CertificateValidityServices;

const runTask = (services: Services) =>
  initializationTaskCreatorCertificateValidity({
    taskName: TASK_NAME,
    services: asContract(services),
  }).run(buildContext() as unknown as InitializationTaskRunContext);

describe('initializationTaskCreatorCertificateValidity', () => {
  it('exposes the given task name (S1.1)', () => {
    expect(
      initializationTaskCreatorCertificateValidity({
        taskName: TASK_NAME,
        services: asContract(buildServices()),
      }).name,
    ).toBe(TASK_NAME);
  });

  it('resolves when every certificate is healthy (R10)', async () => {
    await expect(runTask(buildServices())).resolves.toMatchObject({
      severity: 'ok',
    });
  });

  it('queries every node reported by the cluster (S5.x)', async () => {
    const services = buildServices({ nodes: ['node01', 'worker-02'] });

    await runTask(services);

    expect(services.certificateValidityClient.getNodeTls).toHaveBeenCalledTimes(
      2,
    );
    expect(services.certificateValidityClient.getNodeTls).toHaveBeenCalledWith(
      'manager-local',
      'worker-02',
    );
  });

  it('throws when a certificate is near expiration (R10)', async () => {
    const services = buildServices({
      outcomes: {
        node01: {
          kind: 'ok',
          node: 'node01',
          snapshot: snapshot('node01', 10 * DAY),
        },
      },
    });

    await expect(runTask(services)).rejects.toThrow(/node01/);
  });

  it('throws rather than resolving when the state is undetermined (S6.1)', async () => {
    const services = buildServices({
      outcomes: { node01: { kind: 'notFound', node: 'node01' } },
    });

    await expect(runTask(services)).rejects.toThrow(/could not be determined/i);
  });

  it('does not resolve when only one of two nodes is undetermined (S6.5)', async () => {
    const services = buildServices({
      nodes: ['node01', 'worker-02'],
      outcomes: { 'worker-02': { kind: 'notFound', node: 'worker-02' } },
    });

    await expect(runTask(services)).rejects.toThrow(/worker-02/);
  });

  it('degrades to undetermined when the cluster cannot be listed (T5.5)', async () => {
    const services = buildServices({
      getNodes: jest.fn().mockRejectedValue(new Error('boom')),
    });

    await expect(runTask(services)).rejects.toThrow(/could not be determined/i);
  });

  it('accepts a single host object, not only a list', async () => {
    const services = buildServices({ hosts: { id: 'manager-local' } });

    await runTask(services);

    expect(services.certificateValidityClient.getNodes).toHaveBeenCalledWith(
      'manager-local',
    );
  });

  it('degrades to undetermined when no API host is configured', async () => {
    const services = buildServices({ hosts: [] });

    await expect(runTask(services)).rejects.toThrow(/could not be determined/i);
  });

  it('builds an actionable message (R7, R8)', async () => {
    const services = buildServices({
      outcomes: {
        node01: {
          kind: 'ok',
          node: 'node01',
          snapshot: snapshot('node01', 10 * DAY),
        },
      },
    });

    const message = await runTask(services).catch(error => error.message);

    expect(message).toContain('node01');
    expect(message).toContain('CN=manager-01');
    expect(message).toContain('2026-10-01T00:00:00Z');
    expect(message).toContain('10 day(s)');
    expect(message).toContain('https://documentation.wazuh.com');
    expect(message).toContain('2026-09-15T10:00:00Z');
  });
});
