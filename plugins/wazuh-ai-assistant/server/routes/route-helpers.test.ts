import assert from 'node:assert/strict';
import {
  isPermissionDeniedError,
  PERMISSION_DENIED_MESSAGE,
  withInternalErrorHandling,
  redactSensitiveDetail,
  RouteHandler,
} from './route-helpers';

/**
 * Issue #9057: an RBAC-denied indexer call throws a `security_exception` whose `message`/`reason`
 * embeds the internal cluster action name, the caller's username, and their backend roles. Before
 * this fix, `withInternalErrorHandling` turned that into a `500 { message: describeError(error) }`
 * response, leaking all of it to any authenticated-but-unauthorized caller. These tests prove the
 * sanitized 403 replaces that leak while the full detail still reaches the server log.
 *
 * Same convention as provider-encryption-gate.test.ts: no OSD route-request/response-mocking
 * harness exists in this plugin, so `withInternalErrorHandling` is exercised directly with a
 * hand-rolled `response.customError` recorder and a fake `logger`.
 */

type ResponseFactory = Parameters<RouteHandler>[2];

function fakeResponse(): {
  calls: Array<{ statusCode: number; body: unknown }>;
  factory: ResponseFactory;
} {
  const calls: Array<{ statusCode: number; body: unknown }> = [];
  const factory = {
    customError(options: { statusCode: number; body: unknown }) {
      calls.push(options);
      return { status: options.statusCode, ...options };
    },
  } as unknown as ResponseFactory;
  return { calls, factory };
}

function fakeLogger(): {
  errors: unknown[];
  logger: { error: (...args: unknown[]) => void };
} {
  const errors: unknown[] = [];
  return {
    errors,
    logger: {
      error: (...args: unknown[]) => {
        errors.push(args);
      },
    },
  };
}

// Realistic security_exception: action name, username, and backend roles are all embedded in
// the free-text `reason`/`message` — exactly what must never reach the client.
const RBAC_REASON =
  'no permissions for [cluster:admin/ai_assistant/settings/read] and User [name=qauser, backend_roles=[kibana_user, readall], requestedTenant=null]';

function rbacDeniedError(): unknown {
  const error = new Error(
    `security_exception: [security_exception] Reason: ${RBAC_REASON}`,
  ) as Error & { statusCode: number; meta: unknown };
  error.statusCode = 403;
  error.meta = {
    statusCode: 403,
    body: {
      error: {
        type: 'security_exception',
        reason: RBAC_REASON,
      },
    },
  };
  return error;
}

async function runWrapped(error: unknown): Promise<{
  calls: Array<{ statusCode: number; body: unknown }>;
  errors: unknown[];
}> {
  const { calls, factory } = fakeResponse();
  const { errors, logger } = fakeLogger();
  const handler: RouteHandler = async () => {
    throw error;
  };
  const wrapped = withInternalErrorHandling(
    handler,
    logger as unknown as Parameters<typeof withInternalErrorHandling>[1],
  );
  await wrapped({} as never, {} as never, factory);
  return { calls, errors };
}

test('RBAC-denied security_exception (403) is sanitized to a neutral 403 message', async () => {
  const { calls } = await runWrapped(rbacDeniedError());

  assert.equal(calls.length, 1);
  assert.equal(calls[0].statusCode, 403);
  assert.deepEqual(calls[0].body, { message: PERMISSION_DENIED_MESSAGE });
});

test('the sanitized response body never contains the action name, username, roles, or exception type', async () => {
  const { calls } = await runWrapped(rbacDeniedError());

  const serialized = JSON.stringify(calls[0]);
  assert.doesNotMatch(
    serialized,
    /cluster:admin\/ai_assistant\/settings\/read/,
  );
  assert.doesNotMatch(serialized, /qauser/);
  assert.doesNotMatch(serialized, /kibana_user/);
  assert.doesNotMatch(serialized, /readall/);
  assert.doesNotMatch(serialized, /security_exception/);
  assert.doesNotMatch(serialized, /backend_roles/);
});

test('a 403 detected only via meta.statusCode (no top-level statusCode) is classified identically', async () => {
  const error = {
    message: 'security_exception',
    meta: { statusCode: 403, body: { error: { type: 'security_exception' } } },
  };

  const { calls } = await runWrapped(error);

  assert.equal(calls[0].statusCode, 403);
  assert.deepEqual(calls[0].body, { message: PERMISSION_DENIED_MESSAGE });
});

test('a 403 whose meta.body.error.type is NOT security_exception (e.g. a DLS/FLS denial) is still sanitized', async () => {
  const error = {
    statusCode: 403,
    meta: { statusCode: 403, body: { error: { type: 'forbidden' } } },
  };

  const { calls } = await runWrapped(error);

  assert.equal(calls[0].statusCode, 403);
  assert.deepEqual(calls[0].body, { message: PERMISSION_DENIED_MESSAGE });
});

test('a non-403 error is unchanged: 500 with describeError(error)', async () => {
  const { calls } = await runWrapped(new TypeError('boom'));

  assert.equal(calls[0].statusCode, 500);
  assert.deepEqual(calls[0].body, { message: 'boom' });
});

test('logger.error is called exactly once on the 403 branch, carrying the full detail', async () => {
  const { errors } = await runWrapped(rbacDeniedError());

  assert.equal(errors.length, 1);
  const serialized = JSON.stringify(errors[0]);
  assert.match(serialized, /cluster:admin\/ai_assistant\/settings\/read/);
  assert.match(serialized, /qauser/);
});

test('logger.error is called exactly once on the 500 branch, carrying the full detail', async () => {
  const { errors } = await runWrapped(new Error('boom'));

  assert.equal(errors.length, 1);
  const serialized = JSON.stringify(errors[0]);
  assert.match(serialized, /boom/);
});

test('a non-403 security_exception (500 path) is redacted: no username/roles/action name in the body', async () => {
  const error = rbacDeniedError() as Error & { statusCode: number };
  error.statusCode = 500;
  const { calls } = await runWrapped(error);

  assert.equal(calls[0].statusCode, 500);
  const serialized = JSON.stringify(calls[0]);
  assert.doesNotMatch(serialized, /qauser/);
  assert.doesNotMatch(serialized, /readall/);
  assert.doesNotMatch(serialized, /kibana_user/);
  assert.doesNotMatch(serialized, /backend_roles/);
  assert.doesNotMatch(
    serialized,
    /cluster:admin\/ai_assistant\/settings\/read/,
  );
});

test('logger.error still receives the FULL unredacted message on the 500 branch', async () => {
  const error = rbacDeniedError() as Error & { statusCode: number };
  error.statusCode = 500;
  const { errors } = await runWrapped(error);

  assert.equal(errors.length, 1);
  const serialized = JSON.stringify(errors[0]);
  assert.match(serialized, /qauser/);
  assert.match(serialized, /readall/);
  assert.match(serialized, /cluster:admin\/ai_assistant\/settings\/read/);
});

test('redactSensitiveDetail strips a nested-bracket User[...] identity block, including backend_roles', () => {
  const message =
    'no permissions for [cluster:admin/ai_assistant/settings/read] and User [name=qa9057, backend_roles=[readall, kibanauser], requestedTenant=null]';
  const redacted = redactSensitiveDetail(message);

  assert.doesNotMatch(redacted, /qa9057/);
  assert.doesNotMatch(redacted, /readall/);
  assert.doesNotMatch(redacted, /kibanauser/);
  assert.doesNotMatch(redacted, /backend_roles/);
  assert.match(redacted, /User \[redacted\]/);
});

test('redactSensitiveDetail replaces internal action names with [action]', () => {
  const redacted = redactSensitiveDetail(
    'no permissions for [cluster:admin/ai_assistant/settings/read]',
  );
  assert.doesNotMatch(redacted, /cluster:admin\/ai_assistant\/settings\/read/);
  assert.match(redacted, /\[action\]/);
});

test('redactSensitiveDetail leaves an ordinary operational message unchanged', () => {
  const message = 'Policy not found: wazuh-ai-assistant-sessions-policy';
  assert.equal(redactSensitiveDetail(message), message);
});

test('redactSensitiveDetail: no match, empty string, and multiple occurrences', () => {
  assert.equal(redactSensitiveDetail(''), '');
  assert.equal(
    redactSensitiveDetail('nothing sensitive here'),
    'nothing sensitive here',
  );

  const twoActions =
    'failed on [cluster:admin/ai_assistant/settings/read] then [indices:data/write/index]';
  const redacted = redactSensitiveDetail(twoActions);
  assert.doesNotMatch(redacted, /cluster:admin/);
  assert.doesNotMatch(redacted, /indices:data\/write\/index/);
  assert.equal((redacted.match(/\[action\]/g) || []).length, 2);
});

test('isPermissionDeniedError: only a strict statusCode===403 (top-level or meta) is true', () => {
  assert.equal(isPermissionDeniedError(undefined), false);
  assert.equal(isPermissionDeniedError(null), false);
  assert.equal(isPermissionDeniedError({}), false);
  assert.equal(isPermissionDeniedError('403'), false);
  assert.equal(isPermissionDeniedError({ statusCode: '403' }), false);
  assert.equal(isPermissionDeniedError({ statusCode: 403 }), true);
  assert.equal(isPermissionDeniedError({ meta: { statusCode: 403 } }), true);
  assert.equal(isPermissionDeniedError({ statusCode: 500 }), false);
});
