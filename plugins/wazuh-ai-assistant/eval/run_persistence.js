'use strict';

/**
 * Persistence checks: exercises the owner-scoped CRUD routes for saved conversations
 * (server/routes/conversations.ts, API_PATHS.CONVERSATIONS / CONVERSATION_BY_ID in
 * common/constants.ts) against a REAL dashboard session — no mock provider needed, since these
 * routes never touch an LLM at all. Plain Node 18, CommonJS, zero npm dependencies beyond
 * `sse_client.js`'s `login()` (global `fetch` + Node built-ins only), per this harness's existing
 * "zero deps" constraint (see eval/README.md).
 *
 * Kept as its own runner rather than folded into run_plumbing.js or run_live.js: these routes
 * never call a provider, so this suite needs no mock provider and no LLM and can run standalone.
 *
 * Env vars (same conventions as the rest of eval/):
 *   EVAL_BASE_URL   default "https://localhost:8443"
 *   EVAL_USER       default "admin"
 *   EVAL_PASS       required
 *
 * Exit code = number of FAILed checks (0 = all PASS).
 */

const { login, API_ROOT, cookieHeader } = require('./sse_client');
const { BASE_URL, USER, PASS, fail } = require('./cli-env');

/**
 * Generic authenticated JSON call against a `server/routes/conversations.ts` path. Returns
 * `{status, ok, body}` — `body` is the parsed JSON on a JSON response, or the raw text otherwise
 * (a 404 from `response.notFound()` with no explicit body has an empty string body, for instance).
 * Never throws on a non-2xx status: every check below asserts on `status`/`body` directly, the
 * same style `sse_client.js`'s `chat()` uses for its own non-2xx branch.
 */
async function api(method, path, cookies, jsonBody) {
  const headers = { Cookie: cookieHeader(cookies) };
  if (jsonBody !== undefined) {
    headers['Content-Type'] = 'application/json';
    headers['osd-xsrf'] = 'true';
  } else if (method !== 'GET') {
    headers['osd-xsrf'] = 'true';
  }
  const response = await fetch(`${BASE_URL}${API_ROOT}${path}`, {
    method,
    headers,
    ...(jsonBody !== undefined ? { body: JSON.stringify(jsonBody) } : {}),
  });
  const text = await response.text().catch(() => '');
  let body = text;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      // Leave as raw text (shouldn't happen for this route set, but never crash the harness).
    }
  }
  return { status: response.status, ok: response.ok, body };
}

function report(name, ok, reasons, note) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? ` (${note})` : ''}`);
  if (!ok) {
    for (const reason of reasons) {
      console.log(`    - ${reason}`);
    }
  }
}

function messagesEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return false;
  }
  return a.every(
    (msg, index) =>
      msg.role === b[index].role && msg.content === b[index].content,
  );
}

async function main() {
  console.log(`Logging in to ${BASE_URL} as ${USER}...`);
  const cookies = await login(BASE_URL, USER, PASS);
  console.log('Login OK.\n');

  let failCount = 0;
  let index = 0;
  const totalChecks = 9;
  // Every conversation id this run creates, deleted in the `finally` below regardless of which
  // checks passed/failed — mirrors run_plumbing.js's "restore settings in finally" cleanup style
  // so a failed run never leaves stray saved conversations behind on the target dashboard.
  const createdIds = [];

  const initialMessages = [
    {
      role: 'user',
      content: 'eval/run_persistence.js check message (user turn)',
    },
    {
      role: 'assistant',
      content: 'eval/run_persistence.js check message (assistant turn)',
    },
  ];
  const initialTitle = `eval-persistence-${Date.now()}`;

  let conversationId;

  try {
    // 1. Create.
    index += 1;
    console.log(`[${index}/${totalChecks}]`);
    {
      const reasons = [];
      const created = await api('POST', '/conversations', cookies, {
        title: initialTitle,
        messages: initialMessages,
      });
      if (created.status !== 200) {
        reasons.push(
          `POST /conversations: expected HTTP 200, got ${
            created.status
          } (${JSON.stringify(created.body)})`,
        );
      } else {
        conversationId = created.body && created.body.id;
        if (!conversationId)
          reasons.push('POST /conversations: response body has no `id`');
        if (created.body.title !== initialTitle)
          reasons.push(
            `title mismatch: expected "${initialTitle}", got "${created.body.title}"`,
          );
        if (!messagesEqual(created.body.messages, initialMessages))
          reasons.push('messages mismatch on create response');
        if (!created.body.createdAt || !created.body.updatedAt)
          reasons.push('missing createdAt/updatedAt on create response');
        if ('owner' in created.body)
          reasons.push(
            'create response leaked an `owner` field (should never be echoed to the client)',
          );
      }
      if (conversationId) createdIds.push(conversationId);
      const ok = reasons.length === 0;
      if (!ok) failCount += 1;
      report('create_conversation', ok, reasons);
    }

    if (!conversationId) {
      fail(
        'Cannot continue without a created conversation id — aborting the rest of the suite.',
      );
    }

    // 2. List: present, summary-shaped only (no `messages`).
    index += 1;
    console.log(`[${index}/${totalChecks}]`);
    {
      const reasons = [];
      const listed = await api('GET', '/conversations', cookies);
      if (listed.status !== 200) {
        reasons.push(
          `GET /conversations: expected HTTP 200, got ${listed.status}`,
        );
      } else {
        const entries = (listed.body && listed.body.conversations) || [];
        const match = entries.find(entry => entry.id === conversationId);
        if (!match) {
          reasons.push(
            `created conversation ${conversationId} not present in GET /conversations`,
          );
        } else {
          if (match.title !== initialTitle)
            reasons.push(`list entry title mismatch: "${match.title}"`);
          if ('messages' in match)
            reasons.push(
              'list entry included `messages` — the list route must return summaries only',
            );
        }
      }
      const ok = reasons.length === 0;
      if (!ok) failCount += 1;
      report('list_contains_created', ok, reasons);
    }

    // 3. GET by id: matches what was created.
    index += 1;
    console.log(`[${index}/${totalChecks}]`);
    {
      const reasons = [];
      const fetched = await api(
        'GET',
        `/conversations/${conversationId}`,
        cookies,
      );
      if (fetched.status !== 200) {
        reasons.push(
          `GET /conversations/{id}: expected HTTP 200, got ${fetched.status}`,
        );
      } else {
        if (fetched.body.title !== initialTitle)
          reasons.push('title mismatch on GET by id');
        if (!messagesEqual(fetched.body.messages, initialMessages))
          reasons.push('messages mismatch on GET by id');
      }
      const ok = reasons.length === 0;
      if (!ok) failCount += 1;
      report('get_by_id_matches_created', ok, reasons);
    }

    // 4. PUT new messages/title: persisted.
    const updatedTitle = `${initialTitle}-updated`;
    const updatedMessages = [
      ...initialMessages,
      {
        role: 'user',
        content: 'eval/run_persistence.js check message (second user turn)',
      },
      {
        role: 'assistant',
        content:
          'eval/run_persistence.js check message (second assistant turn)',
      },
    ];
    index += 1;
    console.log(`[${index}/${totalChecks}]`);
    {
      const reasons = [];
      const updated = await api(
        'PUT',
        `/conversations/${conversationId}`,
        cookies,
        {
          title: updatedTitle,
          messages: updatedMessages,
        },
      );
      if (updated.status !== 200) {
        reasons.push(
          `PUT /conversations/{id}: expected HTTP 200, got ${
            updated.status
          } (${JSON.stringify(updated.body)})`,
        );
      } else {
        if (updated.body.title !== updatedTitle)
          reasons.push('title not updated in PUT response');
        if (!messagesEqual(updated.body.messages, updatedMessages))
          reasons.push('messages not updated in PUT response');
      }
      // Re-GET to confirm the write actually persisted server-side, not just echoed in the PUT response.
      const refetched = await api(
        'GET',
        `/conversations/${conversationId}`,
        cookies,
      );
      if (refetched.status !== 200) {
        reasons.push(
          `re-GET after PUT: expected HTTP 200, got ${refetched.status}`,
        );
      } else {
        if (refetched.body.title !== updatedTitle)
          reasons.push('title not persisted after PUT (re-GET mismatch)');
        if (!messagesEqual(refetched.body.messages, updatedMessages))
          reasons.push('messages not persisted after PUT (re-GET mismatch)');
      }
      const ok = reasons.length === 0;
      if (!ok) failCount += 1;
      report('put_persists', ok, reasons);
    }

    // 5. Forge a GET on a non-existent id: expect 404.
    const bogusId = `does-not-exist-${Date.now()}`;
    index += 1;
    console.log(`[${index}/${totalChecks}]`);
    {
      const reasons = [];
      const got = await api('GET', `/conversations/${bogusId}`, cookies);
      if (got.status !== 404)
        reasons.push(
          `expected HTTP 404 for a non-existent id, got ${got.status}`,
        );
      const ok = reasons.length === 0;
      if (!ok) failCount += 1;
      report('get_nonexistent_404', ok, reasons);
    }

    // 6. Forge a DELETE on a non-existent id: expect 404.
    index += 1;
    console.log(`[${index}/${totalChecks}]`);
    {
      const reasons = [];
      const deleted = await api('DELETE', `/conversations/${bogusId}`, cookies);
      if (deleted.status !== 404)
        reasons.push(
          `expected HTTP 404 for a non-existent id, got ${deleted.status}`,
        );
      const ok = reasons.length === 0;
      if (!ok) failCount += 1;
      report('delete_nonexistent_404', ok, reasons);
    }

    // 7. Owner injection: POST with an extra `owner: 'attacker'` field must never result in the
    // conversation actually being filed under that value. Two legitimate outcomes, both a PASS:
    //   (a) the route's schema validator rejects the unrecognized `owner` property outright
    //       (HTTP 400) -- the injected value never reaches the handler at all;
    //   (b) the extra property is silently ignored and the conversation is created normally --
    //       verified by confirming THIS session (the real, authenticated owner) can immediately
    //       see it in its own list and fetch it by id. If the server had actually stored
    //       owner:'attacker' literally, this session's own resolveOwner() would not match it and
    //       both of those would fail (list: absent: get-by-id: 404) -- so seeing them succeed is
    //       a real assertion that the client-supplied value was never used, not just an echo check
    //       (the response body never contains `owner` in the first place -- see check 1).
    index += 1;
    console.log(`[${index}/${totalChecks}]`);
    {
      const reasons = [];
      let note;
      const injected = await api('POST', '/conversations', cookies, {
        title: `${initialTitle}-owner-injection`,
        messages: initialMessages,
        owner: 'attacker',
      });
      if (injected.status === 400) {
        note =
          'schema rejected the unrecognized `owner` property outright (HTTP 400)';
      } else if (injected.status === 200) {
        const injectedId = injected.body && injected.body.id;
        if (injectedId) createdIds.push(injectedId);
        note =
          'extra `owner` property was ignored; verified real ownership below';
        if (!injectedId) {
          reasons.push('POST with extra owner field returned 200 but no `id`');
        } else {
          const listed = await api('GET', '/conversations', cookies);
          const present =
            listed.status === 200 &&
            (listed.body.conversations || []).some(
              entry => entry.id === injectedId,
            );
          if (!present) {
            reasons.push(
              'conversation created with an injected owner:"attacker" is NOT visible in the real ' +
                "session's own list -- suggests the injected value WAS used as the stored owner " +
                '(a real bug), or the create silently failed',
            );
          }
          const fetched = await api(
            'GET',
            `/conversations/${injectedId}`,
            cookies,
          );
          if (fetched.status !== 200) {
            reasons.push(
              `GET by id for the injected-owner conversation returned HTTP ${fetched.status} instead ` +
                'of 200 -- the real session should own (and be able to read) it regardless of the ' +
                'injected `owner` value in the request body',
            );
          }
        }
      } else {
        reasons.push(
          `unexpected HTTP ${injected.status} for a POST with an extra owner field`,
        );
      }
      const ok = reasons.length === 0;
      if (!ok) failCount += 1;
      report('owner_injection_rejected_or_ignored', ok, reasons, note);
    }

    // 8. Delete the original conversation: gone from the list afterward.
    index += 1;
    console.log(`[${index}/${totalChecks}]`);
    {
      const reasons = [];
      const deleted = await api(
        'DELETE',
        `/conversations/${conversationId}`,
        cookies,
      );
      if (deleted.status !== 200) {
        reasons.push(
          `DELETE /conversations/{id}: expected HTTP 200, got ${deleted.status}`,
        );
      } else if (!deleted.body || deleted.body.deleted !== true) {
        reasons.push(
          `DELETE response body missing {deleted:true}: ${JSON.stringify(
            deleted.body,
          )}`,
        );
      }
      const ok = reasons.length === 0;
      if (!ok) failCount += 1;
      report('delete_conversation', ok, reasons);
    }

    // 9. Confirm it is actually gone: absent from the list AND a direct GET now 404s.
    index += 1;
    console.log(`[${index}/${totalChecks}]`);
    {
      const reasons = [];
      const listed = await api('GET', '/conversations', cookies);
      const stillPresent =
        listed.status === 200 &&
        (listed.body.conversations || []).some(
          entry => entry.id === conversationId,
        );
      if (stillPresent)
        reasons.push(
          'deleted conversation is still present in GET /conversations',
        );
      const fetched = await api(
        'GET',
        `/conversations/${conversationId}`,
        cookies,
      );
      if (fetched.status !== 404)
        reasons.push(
          `GET by id after delete: expected HTTP 404, got ${fetched.status}`,
        );
      const ok = reasons.length === 0;
      if (!ok) failCount += 1;
      report('deleted_gone_from_list_and_get', ok, reasons);
    }
  } finally {
    // Best-effort cleanup: delete every conversation this run created, including the
    // owner-injection probe's row (check 7) and the primary one if an earlier assertion threw
    // before check 8 ran. Never lets a cleanup failure mask/override the real check results above.
    for (const id of createdIds) {
      try {
        await api('DELETE', `/conversations/${id}`, cookies);
      } catch {
        // Ignore -- this is best-effort tidy-up, not itself a checked assertion.
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(
    `PASS: ${
      totalChecks - failCount
    }  FAIL: ${failCount}  TOTAL: ${totalChecks}`,
  );
  process.exit(failCount);
}

main().catch(error => {
  console.error('FATAL:', error);
  process.exit(2);
});
