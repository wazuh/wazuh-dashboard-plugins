import assert from 'node:assert/strict';
import {
  createConversation,
  decodeVersion,
  deleteConversation,
  encodeVersion,
  renameConversation,
  updateConversation,
} from './conversation-store';

/**
 * `encodeVersion`/`decodeVersion` are the opaque optimistic-concurrency token round-tripped
 * through `ConversationRecord.version` (see that type's doc comment in common/types.ts) — they
 * replace the saved-objects client's own opaque `version` string now that conversations live in
 * the `wazuh-ai-assistant-sessions` index alias, which has no such single value of its own (only a
 * seq_no/primary_term pair). Both are pure, so — same convention as
 * this plugin's other route-level helpers (`isVersionConflictError`, `resolveOwner`) — they are
 * unit-tested directly rather than through a route, since this plugin has no request/response
 * mocking harness for OpenSearch Dashboards routes.
 */

test('encodeVersion/decodeVersion: round-trips a seq_no/primary_term pair', () => {
  assert.deepEqual(decodeVersion(encodeVersion(3, 1)), {
    seqNo: 3,
    primaryTerm: 1,
  });
  assert.deepEqual(decodeVersion(encodeVersion(0, 0)), {
    seqNo: 0,
    primaryTerm: 0,
  });
});

test('encodeVersion: produces the documented "seqNo:primaryTerm" shape', () => {
  assert.equal(encodeVersion(3, 1), '3:1');
});

test('decodeVersion: parses a well-formed token back into its numeric pair', () => {
  assert.deepEqual(decodeVersion('3:1'), { seqNo: 3, primaryTerm: 1 });
});

test('decodeVersion: parses seq_no/primary_term of 0 correctly (falsy-but-valid numbers)', () => {
  assert.deepEqual(decodeVersion('0:0'), { seqNo: 0, primaryTerm: 0 });
});

test('decodeVersion: returns undefined for a stale/foreign token shape (e.g. a saved-objects version string)', () => {
  assert.equal(decodeVersion('WzEsMV0='), undefined);
});

test('decodeVersion: returns undefined for garbage input', () => {
  assert.equal(decodeVersion('not-a-version'), undefined);
  assert.equal(decodeVersion(''), undefined);
  assert.equal(decodeVersion(':'), undefined);
  assert.equal(decodeVersion('1:'), undefined);
  assert.equal(decodeVersion(':1'), undefined);
});

test('decodeVersion: rejects a negative number in either position (regex only matches digits)', () => {
  assert.equal(decodeVersion('-1:1'), undefined);
  assert.equal(decodeVersion('1:-1'), undefined);
});

// Writes go through the indexer's sessions endpoint as the calling user; reads stay on `search`.
// A minimal `context` exposing only `transport.request` is enough to pin the exact request each
// write function issues and how it reads the endpoint's reply.
describe('session writes (indexer sessions endpoint)', () => {
  const request = jest.fn();
  const context = {
    core: {
      opensearch: { client: { asCurrentUser: { transport: { request } } } },
    },
  } as unknown as Parameters<typeof createConversation>[0];
  const messages = [{ role: 'user' as const, content: 'hi' }];

  afterEach(() => {
    request.mockReset();
  });

  test('createConversation: POSTs only title and messages and returns the endpoint reply', async () => {
    const reply = {
      id: 'abc',
      title: 'T',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      messages,
      version: '0:1',
    };
    request.mockResolvedValue({ body: reply });

    const created = await createConversation(context, { title: 'T', messages });

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/_plugins/_setup/ai_assistant/sessions',
      body: { title: 'T', messages },
    });
    expect(created).toEqual(reply);
  });

  test('updateConversation: PUTs messages, title and expected_version to the id path', async () => {
    const reply = {
      title: 'Kept',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
      messages,
      version: '5:1',
    };
    request.mockResolvedValue({ body: reply });

    const updated = await updateConversation(
      context,
      'abc',
      { messages, title: 'Kept' },
      '4:1',
    );

    expect(request).toHaveBeenCalledWith({
      method: 'PUT',
      path: '/_plugins/_setup/ai_assistant/sessions/abc',
      body: { messages, title: 'Kept', expected_version: '4:1' },
    });
    expect(updated).toEqual(reply);
  });

  test('updateConversation: omits title from the body when none is given', async () => {
    request.mockResolvedValue({ body: {} });

    await updateConversation(context, 'abc', { messages }, '4:1');

    const { body } = request.mock.calls[0][0];
    expect('title' in JSON.parse(JSON.stringify(body))).toBe(false);
  });

  test('updateConversation: URL-encodes the id in the path', async () => {
    request.mockResolvedValue({ body: {} });

    await updateConversation(context, 'a/b c', { messages }, '4:1');

    expect(request.mock.calls[0][0].path).toBe(
      '/_plugins/_setup/ai_assistant/sessions/a%2Fb%20c',
    );
  });

  test('renameConversation: PATCHes only the title and returns the endpoint reply', async () => {
    const reply = {
      id: 'abc',
      title: 'New',
      updated_at: '2026-01-01T00:00:00.000Z',
      version: '6:1',
    };
    request.mockResolvedValue({ body: reply });

    const renamed = await renameConversation(context, 'abc', 'New');

    expect(request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/_plugins/_setup/ai_assistant/sessions/abc',
      body: { title: 'New' },
    });
    expect(renamed).toEqual(reply);
  });

  test('deleteConversation: DELETEs the id path', async () => {
    request.mockResolvedValue({
      body: { message: 'ok', status: 200, id: 'abc' },
    });

    await deleteConversation(context, 'abc');

    expect(request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/_plugins/_setup/ai_assistant/sessions/abc',
    });
  });

  test('a rejected request propagates the client error untouched', async () => {
    const error = Object.assign(new Error('conflict'), { statusCode: 409 });
    request.mockRejectedValue(error);

    await expect(
      updateConversation(context, 'abc', { messages }, '4:1'),
    ).rejects.toBe(error);
  });
});
