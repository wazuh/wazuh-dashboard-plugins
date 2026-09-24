/**
 * @jest-environment node
 */
import assert from 'node:assert/strict';

/**
 * POST /providers/{id}/test: time to FIRST content token, stop at that token, and a 30 s cap that
 * is reported as `timedOut` instead of as a generic failure.
 *
 * Same drive-the-real-handler approach as settings-lock-route-wiring.test.ts (and the same
 * platform-runner caveat: settings.ts imports `@osd/config-schema` at runtime). The adapter
 * registry is mocked with a scripted adapter, and the URL guard because it does a real DNS lookup.
 */
jest.mock('../providers/url-guard', () => ({
  assertProviderUrlAllowed: jest.fn().mockResolvedValue(undefined),
}));

const mockAdapter: {
  chatStream?: (
    config: unknown,
    messages: unknown,
    signal: AbortSignal,
  ) => AsyncIterable<unknown>;
} = {};

jest.mock('../providers/registry', () => ({
  getProviderAdapter: () => mockAdapter,
}));

import { registerSettingsRoutes } from './settings';
import { API_PATHS, PROVIDER_TEST_TIMEOUT_MS } from '../../common/constants';
import { ProviderTestResult } from '../../common/types';

type CapturedHandler = (
  context: unknown,
  request: unknown,
  response: unknown,
) => Promise<unknown>;

function captureTestRoute(): CapturedHandler {
  const handlers = new Map<string, CapturedHandler>();
  const record =
    (method: string) =>
    (config: { path: string }, handler: CapturedHandler) => {
      handlers.set(`${method} ${config.path}`, handler);
    };
  const router = {
    get: record('GET'),
    post: record('POST'),
    put: record('PUT'),
    delete: record('DELETE'),
  };
  const logger = {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
  registerSettingsRoutes(
    router as unknown as Parameters<typeof registerSettingsRoutes>[0],
    logger as unknown as Parameters<typeof registerSettingsRoutes>[1],
  );
  const handler = handlers.get(`POST ${API_PATHS.PROVIDER_TEST('{id}')}`);
  assert.ok(handler, 'POST /providers/{id}/test must be registered');
  return handler;
}

/** Runs the test route against the scripted adapter and returns the body it answered with. */
function runTestRoute(): Promise<ProviderTestResult> {
  const handler = captureTestRoute();
  let body: ProviderTestResult | undefined;
  const response = {
    ok(options: { body: ProviderTestResult }) {
      body = options.body;
      return { status: 200 };
    },
    notFound() {
      throw new Error('unexpected notFound');
    },
  };
  const context = {
    wazuh_ai_assistant: {
      aiProviders: {
        // No apiKey: the decrypt branch is not under test here.
        get: () =>
          Promise.resolve({
            id: 'p-1',
            attributes: {
              name: 'mock',
              type: 'openai_compatible',
              baseUrl: 'http://127.0.0.1:19999/v1',
              model: 'qwen',
            },
          }),
      },
    },
  };
  return handler(context, { params: { id: 'p-1' } }, response).then(() => {
    assert.ok(body, 'the route must answer with response.ok');
    return body;
  });
}

/** Resolves after `ms` of (fake) time, or as soon as `signal` aborts. */
function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function advance(ms: number): Promise<void> {
  // Let the handler reach its next await before and after moving the clock.
  for (let index = 0; index < 20; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
  jest.advanceTimersByTime(ms);
  for (let index = 0; index < 20; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-09-24T12:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
  delete mockAdapter.chatStream;
});

test('stops at the first content token and reports the time to it', async () => {
  let abortedAtFirstToken: boolean | undefined;
  let resumedAfterFirstToken = false;
  let closed = false;
  mockAdapter.chatStream = async function* (_config, _messages, signal) {
    try {
      yield { type: 'reasoning_started' };
      await sleep(14_100, signal);
      yield { type: 'delta', content: 'ok' };
      resumedAfterFirstToken = true;
      yield { type: 'delta', content: ' and more' };
      yield { type: 'done' };
    } finally {
      abortedAtFirstToken = signal.aborted;
      closed = true;
    }
  };

  const pending = runTestRoute();
  await advance(14_100);
  const result = await pending;

  expect(result).toEqual({
    success: true,
    latencyMs: 14_100,
    message: undefined,
    timedOut: false,
  });
  // The rest of the answer was never pulled, and the upstream request was cancelled.
  expect(resumedAfterFirstToken).toBe(false);
  expect(closed).toBe(true);
  expect(abortedAtFirstToken).toBe(true);
  expect(jest.getTimerCount()).toBe(0);
});

test('no content within the cap is a timeout, whatever error the abort itself surfaces', async () => {
  mockAdapter.chatStream = async function* (_config, _messages, signal) {
    yield { type: 'reasoning_started' };
    // A reasoning model still thinking, silent until aborted.
    await sleep(10 * 60_000, signal);
    yield {
      type: 'error',
      message:
        'Could not reach the provider endpoint. (This operation was aborted)',
    };
  };

  const pending = runTestRoute();
  await advance(PROVIDER_TEST_TIMEOUT_MS);
  const result = await pending;

  expect(result).toEqual({
    success: false,
    latencyMs: PROVIDER_TEST_TIMEOUT_MS,
    message: 'No content within 30 s.',
    timedOut: true,
  });
});

test('a provider error is reported as-is and is not a timeout', async () => {
  mockAdapter.chatStream = async function* () {
    yield { type: 'error', message: 'Provider returned 401: invalid key' };
    yield { type: 'done' };
  };

  const result = await runTestRoute();

  expect(result).toEqual({
    success: false,
    latencyMs: 0,
    message: 'Provider returned 401: invalid key',
    timedOut: false,
  });
});
