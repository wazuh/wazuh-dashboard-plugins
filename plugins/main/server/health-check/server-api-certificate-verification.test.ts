import { initializationTaskCreatorServerAPICertificateVerification } from './server-api-certificate-verification';
import type { InitializationTaskRunContext } from './types';
import {
  TASK_RESULT,
  withTaskResult,
} from '../mocks/health-check-task-context.mock';

interface Host {
  id: string;
  url: string;
  ca?: string;
}

const HTTPS = 'https://manager.local';
const CA = '/etc/wazuh-dashboard/certs/manager-ca.pem';

const buildTaskContext = (isCCS = false) =>
  withTaskResult({
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    context: {
      scope: 'internal',
      services: {
        core: {
          opensearch: {
            client: {
              asInternalUser: {
                transport: {
                  request: jest
                    .fn()
                    .mockResolvedValue({ body: isCCS ? { remote: {} } : {} }),
                },
              },
            },
          },
        },
      },
    },
  }) as unknown as InitializationTaskRunContext;

const run = async (hosts: Host[], isCCS = false) => {
  const ctx = buildTaskContext(isCCS);
  const result =
    (await initializationTaskCreatorServerAPICertificateVerification({
      taskName: 'server-api:certificate-verification',
      services: {
        manageHosts: {
          get: jest.fn().mockResolvedValue(hosts),
          resolveVerifyCa: (host: Host) => Boolean(host.ca),
        },
      },
    }).run(ctx)) as unknown as Record<PropertyKey, unknown>;

  return { ctx, result };
};

describe('initializationTaskCreatorServerAPICertificateVerification', () => {
  it('is ok when the host has a ca', async () => {
    const { result } = await run([{ id: 'manager', url: HTTPS, ca: CA }]);

    expect(result[TASK_RESULT]).toBe(true);
    expect(result.status).toBe('ok');
    expect(result.data).toEqual([
      { id: 'manager', verifyCa: true, http: false },
    ]);
  });

  it('warns and names the host and the ca setting when the host has no ca', async () => {
    const { ctx, result } = await run([{ id: 'manager', url: HTTPS }]);

    expect(result.status).toBe('warning');
    expect(result.message).toContain('[manager] has no ca setting');
    expect(result.message).toContain('Set ca for each host');
    expect(ctx.logger.warn).toHaveBeenCalledWith(result.message);
  });

  it('warns that an HTTP host is not encrypted', async () => {
    const { result } = await run([
      { id: 'manager', url: 'http://manager.local', ca: CA },
    ]);

    expect(result.status).toBe('warning');
    expect(result.message).toContain('[manager] uses HTTP');
    expect(result.message).toContain('Use an https URL');
  });

  it('checks only the first host without cross-cluster search', async () => {
    const { result } = await run([
      { id: 'manager', url: HTTPS, ca: CA },
      { id: 'other', url: HTTPS },
    ]);

    expect(result.status).toBe('ok');
  });

  it('names each unverified host with cross-cluster search', async () => {
    const { result } = await run(
      [
        { id: 'manager', url: HTTPS, ca: CA },
        { id: 'cluster-a', url: HTTPS },
        { id: 'cluster-b', url: HTTPS },
      ],
      true,
    );

    expect(result.status).toBe('warning');
    expect(result.message).toContain('[cluster-a]');
    expect(result.message).toContain('[cluster-b]');
    expect(result.message).not.toContain('[manager]');
  });
});
