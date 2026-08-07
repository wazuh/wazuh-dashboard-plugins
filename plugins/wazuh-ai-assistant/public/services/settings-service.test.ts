import {
  API_PATHS,
  MANAGER_SESSION_EXPIRED_COPY,
} from '../../common/constants';
import { resetManagerSessionStateForTesting } from './session-heal';
import { SettingsService } from './settings-service';

/**
 * Integration of the service with the REAL session-heal module (not mocked): a first admin-gated
 * rejection carrying the session-expired copy must trigger probe → /api/login → replay, once.
 */

const httpGet = jest.fn();
const httpPost = jest.fn();
const httpPut = jest.fn();
const httpDelete = jest.fn();
const http = {
  get: httpGet,
  post: httpPost,
  put: httpPut,
  delete: httpDelete,
} as never;

const BROKEN_ACCESS = {
  administrator: false,
  message: `Your Wazuh Manager API ${MANAGER_SESSION_EXPIRED_COPY}. (No token provider)`,
  defaultApiHostId: 'default',
  apiKeyEncryptionEnabled: true,
};
const HEALTHY_ACCESS = {
  administrator: true,
  message: null,
  defaultApiHostId: 'default',
  apiKeyEncryptionEnabled: true,
};

function sessionExpiredError(): Error & { body: { message: string } } {
  return Object.assign(new Error('Forbidden'), {
    body: {
      message: `Your Wazuh Manager API ${MANAGER_SESSION_EXPIRED_COPY}. (Token is not valid)`,
    },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  resetManagerSessionStateForTesting();
  httpGet
    .mockResolvedValueOnce(BROKEN_ACCESS)
    .mockResolvedValue(HEALTHY_ACCESS);
});

describe('SettingsService — session retry on admin-gated writes', () => {
  it('create() heals and replays once after a session-expired 403', async () => {
    const provider = { id: 'p1' };
    httpPost.mockImplementation((path: string) => {
      if (path === '/api/login') {
        return Promise.resolve({});
      }
      return httpPost.mock.calls.filter(([p]) => p === API_PATHS.PROVIDERS)
        .length === 1
        ? Promise.reject(sessionExpiredError())
        : Promise.resolve(provider);
    });

    const service = new SettingsService(http);
    await expect(service.create({} as never)).resolves.toBe(provider);

    const providerPosts = httpPost.mock.calls.filter(
      ([path]) => path === API_PATHS.PROVIDERS,
    );
    const loginPosts = httpPost.mock.calls.filter(
      ([path]) => path === '/api/login',
    );
    expect(providerPosts).toHaveLength(2);
    expect(loginPosts).toHaveLength(1);
  });

  it('updateAssistantSettings() heals and replays once after a session-expired 403', async () => {
    const saved = { privacyDefaultOn: true };
    httpPost.mockResolvedValue({});
    httpPut
      .mockRejectedValueOnce(sessionExpiredError())
      .mockResolvedValueOnce(saved);

    const service = new SettingsService(http);
    await expect(service.updateAssistantSettings({} as never)).resolves.toBe(
      saved,
    );

    expect(httpPut).toHaveBeenCalledTimes(2);
    expect(httpPost).toHaveBeenCalledWith('/api/login', expect.anything());
  });

  it('remove() rejects without retry on a non-session error', async () => {
    const unrelated = Object.assign(new Error('boom'), {
      body: { message: 'Internal server error' },
    });
    httpDelete.mockRejectedValue(unrelated);

    const service = new SettingsService(http);
    await expect(service.remove('p1')).rejects.toBe(unrelated);
    expect(httpDelete).toHaveBeenCalledTimes(1);
    expect(httpPost).not.toHaveBeenCalled();
  });

  it('list() (read-only) is not wrapped: a session-copy failure surfaces unretried', async () => {
    httpGet.mockReset();
    httpGet.mockRejectedValue(sessionExpiredError());

    const service = new SettingsService(http);
    await expect(service.list()).rejects.toMatchObject({
      body: { message: expect.stringContaining(MANAGER_SESSION_EXPIRED_COPY) },
    });
    expect(httpGet).toHaveBeenCalledTimes(1);
    expect(httpPost).not.toHaveBeenCalled();
  });
});
