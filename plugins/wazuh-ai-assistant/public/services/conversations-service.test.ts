import { ConversationsService } from './conversations-service';
import { ChatMessage, ConversationRecord } from '../../common/types';
import { HttpSetup } from '../../../../src/core/public';

function makeHttp() {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
}

const messages: ChatMessage[] = [{ role: 'user', content: 'hi' }];

describe('ConversationsService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('list', () => {
    it('fetches a single short page and returns it as-is', async () => {
      const http = makeHttp();
      http.get.mockResolvedValue({
        conversations: [{ id: 'a', title: 'A', updatedAt: '2024-01-01' }],
        total: 1,
        page: 1,
        perPage: 100,
      });
      const service = new ConversationsService(http as unknown as HttpSetup);

      const result = await service.list();

      expect(result).toEqual([
        { id: 'a', title: 'A', updatedAt: '2024-01-01' },
      ]);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(http.get).toHaveBeenCalledWith(
        '/api/wazuh_ai_assistant/conversations',
        {
          query: { page: 1, perPage: 100 },
        },
      );
    });

    it('loops subsequent pages until the reported total has been fully collected', async () => {
      const http = makeHttp();
      const fullPage = Array.from({ length: 100 }, (_unused, i) => ({
        id: `id-${i}`,
        title: `t${i}`,
        updatedAt: '2024-01-01',
      }));
      const shortPage = Array.from({ length: 50 }, (_unused, i) => ({
        id: `id-${100 + i}`,
        title: `t${100 + i}`,
        updatedAt: '2024-01-01',
      }));
      http.get
        .mockResolvedValueOnce({
          conversations: fullPage,
          total: 150,
          page: 1,
          perPage: 100,
        })
        .mockResolvedValueOnce({
          conversations: shortPage,
          total: 150,
          page: 2,
          perPage: 100,
        });
      const service = new ConversationsService(http as unknown as HttpSetup);

      const result = await service.list();

      expect(result).toHaveLength(150);
      expect(http.get).toHaveBeenCalledTimes(2);
      expect(http.get).toHaveBeenNthCalledWith(
        1,
        '/api/wazuh_ai_assistant/conversations',
        {
          query: { page: 1, perPage: 100 },
        },
      );
      expect(http.get).toHaveBeenNthCalledWith(
        2,
        '/api/wazuh_ai_assistant/conversations',
        {
          query: { page: 2, perPage: 100 },
        },
      );
    });

    it('stops after a single short page even when the server reports a larger total, and warns about the truncation', async () => {
      const http = makeHttp();
      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation();
      http.get.mockResolvedValue({
        conversations: [{ id: 'a', title: 'A', updatedAt: '2024-01-01' }],
        total: 500,
        page: 1,
        perPage: 100,
      });
      const service = new ConversationsService(http as unknown as HttpSetup);

      const result = await service.list();

      expect(result).toHaveLength(1);
      expect(http.get).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        'AI Assistant: conversation list exceeds 2000; showing the first 2000',
      );
    });
  });

  it('create() POSTs the title and messages to the conversations route', async () => {
    const http = makeHttp();
    const created: ConversationRecord = {
      id: 'new-id',
      title: 'New chat',
      updatedAt: '2024-01-01',
      createdAt: '2024-01-01',
      messages,
    };
    http.post.mockResolvedValue(created);
    const service = new ConversationsService(http as unknown as HttpSetup);

    const result = await service.create('New chat', messages);

    expect(result).toBe(created);
    expect(http.post).toHaveBeenCalledWith(
      '/api/wazuh_ai_assistant/conversations',
      {
        body: JSON.stringify({ title: 'New chat', messages }),
      },
    );
  });

  it('get() fetches the single conversation by id', async () => {
    const http = makeHttp();
    const record: ConversationRecord = {
      id: 'c1',
      title: 'T',
      updatedAt: '2024-01-01',
      createdAt: '2024-01-01',
      messages,
    };
    http.get.mockResolvedValue(record);
    const service = new ConversationsService(http as unknown as HttpSetup);

    const result = await service.get('c1');

    expect(result).toBe(record);
    expect(http.get).toHaveBeenCalledWith(
      '/api/wazuh_ai_assistant/conversations/c1',
    );
  });

  describe('update', () => {
    it('never sends a title (issue #9010: a resent title on every auto-save used to revert renames)', async () => {
      const http = makeHttp();
      http.put.mockResolvedValue({});
      const service = new ConversationsService(http as unknown as HttpSetup);

      await service.update('c1', messages);

      const [, options] = http.put.mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body).toEqual({ messages });
      expect(body).not.toHaveProperty('title');
      expect(body).not.toHaveProperty('expectedVersion');
    });

    it('includes expectedVersion in the body when passed', async () => {
      const http = makeHttp();
      http.put.mockResolvedValue({});
      const service = new ConversationsService(http as unknown as HttpSetup);

      await service.update('c1', messages, 'WzEsMV0=');

      const [url, options] = http.put.mock.calls[0];
      expect(url).toBe('/api/wazuh_ai_assistant/conversations/c1');
      const body = JSON.parse(options.body);
      expect(body).toEqual({
        messages,
        expectedVersion: 'WzEsMV0=',
      });
    });

    it('propagates a version-conflict (or any other) rejection to the caller unchanged', async () => {
      const http = makeHttp();
      const conflict = { statusCode: 409, message: 'Conflict' };
      http.put.mockRejectedValue(conflict);
      const service = new ConversationsService(http as unknown as HttpSetup);

      await expect(
        service.update('c1', messages, 'stale-version'),
      ).rejects.toBe(conflict);
    });
  });

  describe('rename', () => {
    it('PATCHes only the title, and returns the response body (summary + version)', async () => {
      const http = makeHttp();
      const renamed = {
        id: 'c1',
        title: 'New title',
        updatedAt: '2024-01-01',
        version: '4:1',
      };
      const patch = jest.fn().mockResolvedValue(renamed);
      const service = new ConversationsService({
        ...http,
        patch,
      } as unknown as HttpSetup);

      const result = await service.rename('c1', 'New title');

      expect(result).toBe(renamed);
      expect(patch).toHaveBeenCalledWith(
        '/api/wazuh_ai_assistant/conversations/c1',
        { body: JSON.stringify({ title: 'New title' }) },
      );
    });
  });

  it('remove() DELETEs the conversation by id', async () => {
    const http = makeHttp();
    http.delete.mockResolvedValue(undefined);
    const service = new ConversationsService(http as unknown as HttpSetup);

    await service.remove('c1');

    expect(http.delete).toHaveBeenCalledWith(
      '/api/wazuh_ai_assistant/conversations/c1',
    );
  });
});
