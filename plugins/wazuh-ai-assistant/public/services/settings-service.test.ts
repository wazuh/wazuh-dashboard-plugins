import { SettingsService } from './settings-service';

/**
 * Provider/settings writes run directly against the Wazuh indexer as the current user
 * (server/settings/opensearch-user.ts) — no Manager/wz-token involved, so unlike before there is
 * no session heal/retry wrapping on these calls anymore (session-heal.test.ts covers that
 * machinery, which chat's Manager-path calls still use). These cases prove a write just
 * resolves/rejects straight through to the underlying `http` call, with no `/api/login` side call.
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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SettingsService — provider/settings writes run unwrapped', () => {
  it('create() resolves directly from the POST call', async () => {
    const provider = { id: 'p1' };
    httpPost.mockResolvedValue(provider);

    const service = new SettingsService(http);
    await expect(service.create({} as never)).resolves.toBe(provider);
    expect(httpPost).toHaveBeenCalledTimes(1);
  });

  it('updateAssistantSettings() resolves directly from the PUT call', async () => {
    const saved = { privacyDefaultOn: true };
    httpPut.mockResolvedValue(saved);

    const service = new SettingsService(http);
    await expect(service.updateAssistantSettings({} as never)).resolves.toBe(
      saved,
    );
    expect(httpPut).toHaveBeenCalledTimes(1);
    expect(httpPost).not.toHaveBeenCalled();
  });

  it('a real 403 from the indexer surfaces as-is, with no heal/retry', async () => {
    const forbidden = Object.assign(new Error('Forbidden'), {
      body: { message: 'missing plugin:wazuh/ai_assistant/settings/write' },
    });
    httpDelete.mockRejectedValue(forbidden);

    const service = new SettingsService(http);
    await expect(service.remove('p1')).rejects.toBe(forbidden);
    expect(httpDelete).toHaveBeenCalledTimes(1);
    expect(httpPost).not.toHaveBeenCalled();
  });

  it('list() surfaces a rejection unretried, same as every other read', async () => {
    const unrelated = Object.assign(new Error('boom'), {
      body: { message: 'Internal server error' },
    });
    httpGet.mockRejectedValue(unrelated);

    const service = new SettingsService(http);
    await expect(service.list()).rejects.toBe(unrelated);
    expect(httpPost).not.toHaveBeenCalled();
  });
});
