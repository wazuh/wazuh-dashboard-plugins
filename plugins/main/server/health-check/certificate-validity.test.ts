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
import {
  CERTIFICATE_EXPIRY_CRITICAL_SETTING,
  CERTIFICATE_EXPIRY_WARNING_SETTING,
} from '../../common/constants';

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
    loaded_at: '2026-09-14T08:00:00Z',
    loaded_at_ts: 1_789_344_000,
  },
  ca_bundle: {
    path: 'etc/certs/root-ca.pem',
    publication: 1_789_423_200,
    publication_vouched: true,
    content_sha256: 'abc',
    certificates_count: 1,
    serialized_bytes: 2428,
    serialized_bytes_limit: 8191,
    matches_active_leaf: true,
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
});

const buildConfiguration = (settings: Record<string, number> = {}) => {
  const values: Record<string, number> = {
    [CERTIFICATE_EXPIRY_WARNING_SETTING]: 30,
    [CERTIFICATE_EXPIRY_CRITICAL_SETTING]: 7,
    ...settings,
  };

  return {
    get: jest.fn((key: string) =>
      key in values
        ? Promise.resolve(values[key])
        : Promise.reject(new Error(`Configuration ${key} not found`)),
    ),
  };
};

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

const withConfiguration = (
  services: Services,
  settings?: Record<string, number>,
) => asContract({ ...services, configuration: buildConfiguration(settings) });

const runTask = (services: Services, settings?: Record<string, number>) =>
  initializationTaskCreatorCertificateValidity({
    taskName: TASK_NAME,
    services: withConfiguration(services, settings),
  }).run(buildContext() as unknown as InitializationTaskRunContext);

const runTaskWithContext = async (
  services: Services,
  settings?: Record<string, number>,
) => {
  const context = buildContext();
  const result = await initializationTaskCreatorCertificateValidity({
    taskName: TASK_NAME,
    services: withConfiguration(services, settings),
  }).run(context as unknown as InitializationTaskRunContext);

  return { result, logger: context.logger };
};

describe('initializationTaskCreatorCertificateValidity', () => {
  it('exposes the given task name', () => {
    expect(
      initializationTaskCreatorCertificateValidity({
        taskName: TASK_NAME,
        services: asContract(buildServices()),
      }).name,
    ).toBe(TASK_NAME);
  });

  it('reports ok when every certificate is healthy', async () => {
    await expect(runTask(buildServices())).resolves.toMatchObject({
      status: 'ok',
      data: { severity: 'ok' },
    });
  });

  it('queries every node reported by the cluster', async () => {
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

  it('warns when a certificate is near expiration', async () => {
    const services = buildServices({
      outcomes: {
        node01: {
          kind: 'ok',
          node: 'node01',
          snapshot: snapshot('node01', 10 * DAY),
        },
      },
    });

    await expect(runTask(services)).resolves.toMatchObject({
      status: 'warning',
      message: expect.stringContaining('node01'),
    });
  });

  it('reports an error when a certificate is about to expire', async () => {
    const services = buildServices({
      outcomes: {
        node01: {
          kind: 'ok',
          node: 'node01',
          snapshot: snapshot('node01', 3 * DAY),
        },
      },
    });

    await expect(runTask(services)).resolves.toMatchObject({
      status: 'error',
      message: expect.stringContaining('node01'),
      data: { severity: 'critical' },
    });
  });

  it('reports an error when a certificate has already expired', async () => {
    const services = buildServices({
      outcomes: {
        node01: {
          kind: 'ok',
          node: 'node01',
          snapshot: snapshot('node01', -1 * DAY),
        },
      },
    });

    await expect(runTask(services)).resolves.toMatchObject({
      status: 'error',
      message: expect.stringMatching(/expired/i),
    });
  });

  it('warns rather than reporting ok when the state is undetermined', async () => {
    const services = buildServices({
      outcomes: { node01: { kind: 'notFound', node: 'node01' } },
    });

    await expect(runTask(services)).resolves.toMatchObject({
      status: 'warning',
      message: expect.stringMatching(/could not be determined/i),
    });
  });

  it('does not report ok when only one of two nodes is undetermined', async () => {
    const services = buildServices({
      nodes: ['node01', 'worker-02'],
      outcomes: { 'worker-02': { kind: 'notFound', node: 'worker-02' } },
    });

    await expect(runTask(services)).resolves.toMatchObject({
      status: 'warning',
      message: expect.stringContaining('worker-02'),
    });
  });

  it('degrades to undetermined when the cluster cannot be listed', async () => {
    const services = buildServices({
      getNodes: jest.fn().mockRejectedValue(new Error('boom')),
    });

    await expect(runTask(services)).resolves.toMatchObject({
      status: 'warning',
      message: expect.stringMatching(/could not be determined/i),
    });
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

    await expect(runTask(services)).resolves.toMatchObject({
      status: 'warning',
      message: expect.stringMatching(/could not be determined/i),
    });
  });

  it('reads both thresholds from the configuration store', async () => {
    const configuration = buildConfiguration();
    const services = {
      ...buildServices({
        outcomes: {
          node01: {
            kind: 'ok',
            node: 'node01',
            snapshot: snapshot('node01', 20 * DAY),
          },
        },
      }),
      configuration,
    };

    await expect(
      initializationTaskCreatorCertificateValidity({
        taskName: TASK_NAME,
        services: asContract(services),
      }).run(buildContext() as unknown as InitializationTaskRunContext),
    ).resolves.toMatchObject({ status: 'warning' });

    expect(configuration.get).toHaveBeenCalledWith(
      CERTIFICATE_EXPIRY_WARNING_SETTING,
    );
    expect(configuration.get).toHaveBeenCalledWith(
      CERTIFICATE_EXPIRY_CRITICAL_SETTING,
    );
  });

  it('honours a configured warning threshold', async () => {
    const services = buildServices({
      outcomes: {
        node01: {
          kind: 'ok',
          node: 'node01',
          snapshot: snapshot('node01', 20 * DAY),
        },
      },
    });

    // 20 days is inside the default 30-day warning, outside a 10-day one
    await expect(
      runTask(services, { [CERTIFICATE_EXPIRY_WARNING_SETTING]: 10 }),
    ).resolves.toMatchObject({ status: 'ok' });
  });

  it('honours a configured error threshold', async () => {
    const services = buildServices({
      outcomes: {
        node01: {
          kind: 'ok',
          node: 'node01',
          snapshot: snapshot('node01', 20 * DAY),
        },
      },
    });

    await expect(
      runTask(services, { [CERTIFICATE_EXPIRY_CRITICAL_SETTING]: 25 }),
    ).resolves.toMatchObject({ status: 'error' });
  });

  it('reports a healthy check at info, not debug', async () => {
    const { logger } = await runTaskWithContext(buildServices());

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('are valid'),
    );
  });

  it('reports a critical certificate at error level', async () => {
    const { logger } = await runTaskWithContext(
      buildServices({
        outcomes: {
          node01: {
            kind: 'ok',
            node: 'node01',
            snapshot: snapshot('node01', 3 * DAY),
          },
        },
      }),
    );

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('node01'),
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('reports an undetermined state at warn level', async () => {
    const { logger } = await runTaskWithContext(
      buildServices({
        outcomes: { node01: { kind: 'notFound', node: 'node01' } },
      }),
    );

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringMatching(/could not be determined/i),
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('lists one line per affected node, not one paragraph', async () => {
    const nodes = ['node01', 'worker-02', 'worker-03'];
    const services = buildServices({
      nodes,
      outcomes: Object.fromEntries(
        nodes.map(node => [
          node,
          { kind: 'ok', node, snapshot: snapshot(node, 3 * DAY) },
        ]),
      ) as Record<string, CertificateValidityOutcome>,
    });

    const { message } = (await runTask(services)) as { message: string };
    const bulleted = message.split('\n').filter(line => line.startsWith('- '));

    expect(bulleted).toHaveLength(nodes.length);
    for (const node of nodes) {
      expect(bulleted.some(line => line.includes(node))).toBe(true);
    }
  });

  it('builds an actionable message', async () => {
    const services = buildServices({
      outcomes: {
        node01: {
          kind: 'ok',
          node: 'node01',
          snapshot: snapshot('node01', 10 * DAY),
        },
      },
    });

    const { message } = (await runTask(services)) as { message: string };

    expect(message).toContain('node01');
    expect(message).toContain('CN=manager-01');
    expect(message).toContain('2026-10-01T00:00:00Z');
    expect(message).toContain('10 day(s)');
    expect(message).toContain('2026-09-14T08:00:00Z');
    expect(message).toContain('Ensure the listener certificate is replaced');
    expect(message).toContain('remoted restarted');
    expect(message).not.toContain('2026-09-15T10:00:00Z');
  });

  it('does not tell an operator to restart over a CA finding', async () => {
    const bundleOnly = snapshot('node01', 3650 * DAY);

    bundleOnly.ca_bundle.matches_active_leaf = false;

    const services = buildServices({
      outcomes: {
        node01: { kind: 'ok', node: 'node01', snapshot: bundleOnly },
      },
    });

    const { message } = (await runTask(services)) as { message: string };

    expect(message).toContain('No CA in the bundle');
    expect(message).not.toContain('remoted restart');
    expect(message).not.toContain('2026-09-14T08:00:00Z');
  });

  it('states each action once, not once per node', async () => {
    const nodes = ['node01', 'worker-02', 'worker-03'];
    const services = buildServices({
      nodes,
      outcomes: Object.fromEntries(
        nodes.map(node => [
          node,
          { kind: 'ok', node, snapshot: snapshot(node, 10 * DAY) },
        ]),
      ),
    });

    const { message } = (await runTask(services)) as { message: string };
    const occurrences =
      message.split('Ensure the listener certificate').length - 1;

    expect(message).toContain('worker-03');
    expect(message.split('expires in 10 day(s)').length - 1).toBe(3);
    expect(occurrences).toBe(1);
  });

  it('links to no documentation page while none covers certificates', async () => {
    const services = buildServices({
      outcomes: {
        node01: {
          kind: 'ok',
          node: 'node01',
          snapshot: snapshot('node01', 10 * DAY),
        },
      },
    });

    const { message } = (await runTask(services)) as { message: string };

    expect(message).not.toContain('documentation.wazuh.com');
    expect(message).not.toMatch(/https?:\/\//);
  });
});
