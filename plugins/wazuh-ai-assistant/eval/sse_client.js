'use strict';

/**
 * Shared SSE client for the eval harness (Node 18, CommonJS, zero deps beyond Node built-ins:
 * global fetch only). Talks to:
 *   - the dashboard's own auth flow (POST /auth/login, POST /api/login) to get a session cookie
 *     jar, exactly as a browser session would;
 *   - server/routes/chat.ts's POST /api/wazuh_ai_assistant/chat (API_PATHS.CHAT built from
 *     common/constants.ts:9,12: API_ROOT + '/chat'), parsing the `data: {json}\n\n` SSE frames
 *     it emits (chat.ts:29-31 toSseFrame; StreamEvent union in common/types.ts:100-111).
 *
 * TLS: the target dashboard uses a self-signed cert. This file never sets
 * NODE_TLS_REJECT_UNAUTHORIZED itself -- that must come from the environment
 * the caller runs `node` in (see eval/README.md), never be hardcoded here.
 */

const API_ROOT = '/api/wazuh_ai_assistant'; // common/constants.ts:9

/** No SSE read (or any single fetch) in this harness should time out sooner than this. */
const DEFAULT_TIMEOUT_MS = 240000;

/**
 * Extracts every Set-Cookie header value from a fetch Response, across Node/undici versions.
 * `Headers.get('set-cookie')` folds multiple Set-Cookie headers into one comma-joined string per
 * the Fetch spec, which is ambiguous (an Expires attribute itself contains ", "); Node >=18.14's
 * undici exposes `getSetCookie()` to sidestep that. Fall back to a comma-split that only treats a
 * comma as a cookie separator when followed by a bare `token=`, since `Expires=Wed, 21 Oct...`
 * is never followed by that shape.
 */
function extractSetCookies(response) {
  if (typeof response.headers.getSetCookie === 'function') {
    const list = response.headers.getSetCookie();
    if (list && list.length) {
      return list;
    }
  }
  const raw = response.headers.get('set-cookie');
  if (!raw) {
    return [];
  }
  return raw.split(/,(?=\s*[^=;,\s]+=)/).map(part => part.trim());
}

/** Parses one Set-Cookie header's name=value pair, ignoring attributes (Path/Expires/etc.). */
function parseCookiePair(setCookieHeader) {
  const firstPart = setCookieHeader.split(';')[0];
  const eq = firstPart.indexOf('=');
  if (eq === -1) {
    return null;
  }
  return {
    name: firstPart.slice(0, eq).trim(),
    value: firstPart.slice(eq + 1).trim(),
  };
}

/** Merges Set-Cookie headers into a plain-object cookie jar (name -> value); mutates and returns jar. */
function mergeCookies(jar, setCookieHeaders) {
  for (const header of setCookieHeaders) {
    const pair = parseCookiePair(header);
    if (pair) {
      jar[pair.name] = pair.value;
    }
  }
  return jar;
}

/** Serializes a cookie jar back into a single `Cookie:` request header value. */
function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function safeText(response) {
  try {
    return await response.text();
  } catch {
    return '<unreadable body>';
  }
}

/**
 * Logs in against a live OpenSearch Dashboards + Wazuh instance and returns a cookie jar good for
 * every subsequent request in this process:
 *   1. POST /auth/login {username,password} -- OSD Security's own session login.
 *   2. POST /api/login {idHost:"default"} -- the Wazuh `main` plugin's Manager-API JWT exchange;
 *      this is what sets the `wz-token`/`wz-api` cookies executor.ts:56-79 relies on to resolve
 *      which Manager host a tool call should hit (the
 *      plugin rides this session, it never builds a parallel auth path).
 * Every non-GET OSD route requires the `osd-xsrf: true` header (OSD's CSRF guard) -- both calls
 * here, and every chat call below, send it. Cookies accumulate across both login calls.
 */
async function login(baseUrl, username, password) {
  const jar = {};

  const authResponse = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'osd-xsrf': 'true' },
    body: JSON.stringify({ username, password }),
  });
  mergeCookies(jar, extractSetCookies(authResponse));
  if (!authResponse.ok) {
    throw new Error(
      `/auth/login failed: HTTP ${authResponse.status} ${await safeText(
        authResponse,
      )}`,
    );
  }

  const apiLoginResponse = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'osd-xsrf': 'true',
      Cookie: cookieHeader(jar),
    },
    body: JSON.stringify({ idHost: 'default' }),
  });
  mergeCookies(jar, extractSetCookies(apiLoginResponse));
  if (!apiLoginResponse.ok) {
    throw new Error(
      `/api/login failed: HTTP ${apiLoginResponse.status} ${await safeText(
        apiLoginResponse,
      )}`,
    );
  }

  return jar;
}

/**
 * Parses one SSE response body into an array of parsed StreamEvent objects. Frames can split
 * across chunk boundaries (fetch delivers arbitrary byte windows), so this buffers a trailing
 * partial line the same way server/providers/sse_utils.ts:11-53 does for the upstream provider
 * fetch, additionally buffering on the blank-line frame terminator chat.ts's frames actually use
 * (toSseFrame, chat.ts:29-31: `data: ${json}\n\n`) so a frame split mid-payload is never parsed
 * early. Lines that aren't `data:` prefixed (blank lines, any future SSE comment/keepalive) are
 * ignored rather than erroring.
 */
async function* iterateSseEvents(body, signal) {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  try {
    while (true) {
      if (signal.aborted) {
        return;
      }
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let separatorIndex = buffer.indexOf('\n\n');
      while (separatorIndex !== -1) {
        const rawFrame = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        for (const line of rawFrame.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) {
            continue;
          }
          const payload = trimmed.slice('data:'.length).trim();
          if (!payload) {
            continue;
          }
          try {
            yield JSON.parse(payload);
          } catch {
            // Malformed/partial frame: skip it rather than crashing the whole eval run.
          }
        }
        separatorIndex = buffer.indexOf('\n\n');
      }
    }
    // Trailing frame with no final blank-line terminator (connection closed right after it).
    const trailing = buffer.trim();
    if (trailing.startsWith('data:')) {
      const payload = trailing.slice('data:'.length).trim();
      if (payload) {
        try {
          yield JSON.parse(payload);
        } catch {
          // ignore
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * POSTs one chat turn to server/routes/chat.ts and collects every StreamEvent the SSE stream
 * emits, in order, stopping at the terminal `done`/`error` event (chat.ts only ever emits one of
 * those, last: streamSseFrames, chat.ts:228-243). Body shape per chat.ts's route validator
 * (chat.ts:38-66): `{providerId, messages:[{role,content}]}` -- this harness only ever sends a
 * single fresh `user` turn per call (no multi-turn conversation replay), matching how each eval
 * case is a standalone prompt.
 *
 * `options.privacy` (privacy pipeline eval, common/types.ts's `ChatRequest['privacy']`) is an
 * additive, backward-compatible extra: when omitted the request body is byte-identical to before
 * this option existed (no `privacy` key at all), so every existing call site (run_live.js,
 * run_plumbing.js's pre-existing checks) is unaffected.
 *
 * Non-2xx responses are never thrown -- this function already surfaces them as a single synthetic
 * `{type:'error', message:'HTTP <status> ...'}` event via the `!response.ok` branch below, same as
 * any other chat-endpoint failure.
 */
async function chat(baseUrl, cookieJar, providerId, prompt, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${API_ROOT}/chat`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'osd-xsrf': 'true',
        Cookie: cookieHeader(cookieJar),
      },
      body: JSON.stringify({
        providerId,
        messages: [{ role: 'user', content: prompt }],
        ...(options.privacy ? { privacy: options.privacy } : {}),
      }),
    });
    if (!response.ok || !response.body) {
      const text = await safeText(response);
      return [
        {
          type: 'error',
          message: `HTTP ${response.status} from chat endpoint: ${text}`,
        },
      ];
    }
    const events = [];
    for await (const event of iterateSseEvents(
      response.body,
      controller.signal,
    )) {
      events.push(event);
      if (event && (event.type === 'done' || event.type === 'error')) {
        break;
      }
    }
    return events;
  } catch (error) {
    if (controller.signal.aborted) {
      return [
        { type: 'error', message: `Client-side timeout after ${timeoutMs}ms` },
      ];
    }
    return [
      {
        type: 'error',
        message: `Request failed: ${
          error && error.message ? error.message : String(error)
        }`,
      },
    ];
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  API_ROOT,
  login,
  chat,
  extractSetCookies,
  mergeCookies,
  cookieHeader,
};
