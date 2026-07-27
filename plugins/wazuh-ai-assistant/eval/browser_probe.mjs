/**
 * Automated browser-side probe for the AI Assistant plugin.
 * Launches a throwaway headless Chrome with --ignore-certificate-errors, speaks CDP
 * over Node's built-in WebSocket (no npm deps, same zero-dependency rule as the rest of eval/), and
 * measures the things only a real browser can answer:
 *
 *   A. Per-tab JS heap for a freshly-loaded app tab (the idle-tab memory floor).
 *   B. Stored-XSS render check: an assistant message containing an <img onerror>, a <script>, and a
 *      javascript: link is persisted through the real conversations API, then re-opened in the app.
 *      Asserts nothing executed and no live <img>/<script> element was created.
 *   C. The HTTP/1.1 per-origin connection cap: N concurrent SSE chat requests from one page,
 *      recording each one's time-to-first-byte, which exposes how many actually stream in parallel.
 *   D. Heap growth across UI-driven chat turns (typed into the real textarea, Enter to send).
 *   E. Screenshots of the chat UI for a visual pass.
 *
 * Usage (from the repo's eval/ directory, with the dashboard reachable and a provider configured):
 *   node browser_probe.mjs
 * Env:
 *   PROBE_BASE_URL   default https://localhost:8444
 *   PROBE_USER/PASS  default admin/admin
 *   PROBE_PROVIDER   provider id used for the streaming/turn tests (required for C and D)
 *   PROBE_CHROME     path to chrome.exe (default: the common Windows install locations)
 *   PROBE_TURNS      UI-driven turns for test D (default 6)
 *   PROBE_STREAMS    concurrent streams for test C (default 10)
 *   PROBE_OUT        directory for screenshots + results.json (default ./loadout/browser)
 */
import { spawn } from 'child_process';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const BASE = process.env.PROBE_BASE_URL || 'https://localhost:8444';
const USER = process.env.PROBE_USER || 'admin';
const PASS = process.env.PROBE_PASS || 'admin';
const PROVIDER = process.env.PROBE_PROVIDER || '';
const TURNS = Number(process.env.PROBE_TURNS || 6);
const STREAMS = Number(process.env.PROBE_STREAMS || 10);
const OUT = process.env.PROBE_OUT || join('loadout', 'browser');
const PORT = 9333;

const CHROME_CANDIDATES = [
  process.env.PROBE_CHROME,
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].filter(Boolean);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = { base: BASE, tests: {} };

function findChrome() {
  for (const c of CHROME_CANDIDATES) if (existsSync(c)) return c;
  throw new Error(
    `Chrome not found; set PROBE_CHROME. Tried: ${CHROME_CANDIDATES.join(
      ', ',
    )}`,
  );
}

/** Minimal CDP client over Node's global WebSocket. */
class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
    this.ready = new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res());
      this.ws.addEventListener('error', e =>
        rej(new Error(`CDP socket error: ${e.message || e}`)),
      );
    });
    this.ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error
          ? reject(
              new Error(
                `${msg.error.message} (${JSON.stringify(
                  msg.error.data ?? {},
                )})`,
              ),
            )
          : resolve(msg.result);
      }
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params, ...(sessionId ? { sessionId } : {}) };
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 120000);
    });
  }
  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

/** Runtime.evaluate with awaitPromise + value return, throwing on JS exceptions. */
async function evalJs(cdp, sessionId, expression) {
  const r = await cdp.send(
    'Runtime.evaluate',
    {
      expression,
      awaitPromise: true,
      returnByValue: true,
    },
    sessionId,
  );
  if (r.exceptionDetails) {
    throw new Error(
      `page JS threw: ${
        r.exceptionDetails.exception?.description || r.exceptionDetails.text
      }`,
    );
  }
  return r.result?.value;
}

async function waitFor(
  cdp,
  sessionId,
  expression,
  timeoutMs = 60000,
  label = expression,
) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      if (await evalJs(cdp, sessionId, expression)) return true;
    } catch {}
    if (Date.now() > deadline)
      throw new Error(`timed out waiting for: ${label}`);
    await sleep(300);
  }
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const chrome = findChrome();
  const userDataDir = join(process.env.TEMP || '.', `aiaprobe-${Date.now()}`);
  const args = [
    '--headless=new',
    '--ignore-certificate-errors',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--js-flags=--expose-gc',
    '--window-size=1440,900',
    'about:blank',
  ];
  console.log(`launching: ${chrome}`);
  const proc = spawn(chrome, args, { stdio: 'ignore', detached: false });

  // Wait for the debugging endpoint.
  let wsUrl = null;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try {
      const v = await fetch(`http://127.0.0.1:${PORT}/json/version`).then(r =>
        r.json(),
      );
      wsUrl = v.webSocketDebuggerUrl;
    } catch {
      await sleep(500);
    }
  }
  if (!wsUrl) {
    proc.kill();
    throw new Error('Chrome debugging endpoint never came up');
  }

  const cdp = new Cdp(wsUrl);
  await cdp.ready;
  const { targetId } = await cdp.send('Target.createTarget', {
    url: 'about:blank',
  });
  const { sessionId } = await cdp.send('Target.attachToTarget', {
    targetId,
    flatten: true,
  });
  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);

  try {
    // ---- authenticate inside the browser so cookies are set natively ----
    await cdp.send('Page.navigate', { url: `${BASE}/app/login` }, sessionId);
    await waitFor(
      cdp,
      sessionId,
      'document.readyState === "complete"',
      60000,
      'login page load',
    );
    const loginStatus = await evalJs(
      cdp,
      sessionId,
      `(async () => {
      const a = await fetch('/auth/login', { method:'POST', headers:{'Content-Type':'application/json','osd-xsrf':'true'},
        body: JSON.stringify({ username: ${JSON.stringify(
          USER,
        )}, password: ${JSON.stringify(PASS)} }) });
      const b = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json','osd-xsrf':'true'},
        body: JSON.stringify({ idHost: 'default' }) });
      return a.status + '/' + b.status;
    })()`,
    );
    console.log('login (auth/api):', loginStatus);
    results.tests.login = loginStatus;

    // ---- TEST A: idle-tab heap floor ----
    await cdp.send(
      'Page.navigate',
      { url: `${BASE}/app/wazuhAiAssistant` },
      sessionId,
    );
    await waitFor(
      cdp,
      sessionId,
      'document.querySelector("textarea") !== null',
      90000,
      'chat UI textarea',
    );
    await sleep(2500);
    const heapA = await evalJs(
      cdp,
      sessionId,
      'performance.memory ? performance.memory.usedJSHeapSize : null',
    );
    results.tests.idleTabHeapBytes = heapA;
    console.log(
      `A. idle app tab heap: ${
        heapA
          ? (heapA / 1048576).toFixed(1) + ' MB'
          : 'performance.memory unavailable'
      }`,
    );
    const shotA = await cdp.send(
      'Page.captureScreenshot',
      { format: 'png' },
      sessionId,
    );
    writeFileSync(
      join(OUT, 'A-welcome.png'),
      Buffer.from(shotA.data, 'base64'),
    );

    // ---- TEST B: stored-XSS render check ----
    const xssPayload =
      '<img src=x onerror="window.__xss_img=1"> <script>window.__xss_script=1</script> [click](javascript:window.__xss_link=1)';
    const created = await evalJs(
      cdp,
      sessionId,
      `(async () => {
      const r = await fetch('/api/wazuh_ai_assistant/conversations', { method:'POST',
        headers:{'Content-Type':'application/json','osd-xsrf':'true'},
        body: JSON.stringify({ title:'xss-probe', messages:[
          { role:'user', content:'render this' },
          { role:'assistant', content: ${JSON.stringify(xssPayload)} }]}) });
      const j = await r.json().catch(() => ({}));
      return JSON.stringify({ status: r.status, id: j.id || null });
    })()`,
    );
    const { status: xssStatus, id: xssId } = JSON.parse(created);
    console.log('B. stored xss conversation created:', xssStatus, xssId);
    if (xssId) {
      await cdp.send(
        'Page.navigate',
        { url: `${BASE}/app/wazuhAiAssistant` },
        sessionId,
      );
      await waitFor(
        cdp,
        sessionId,
        'document.querySelector("textarea") !== null',
        90000,
        'chat UI reload',
      );
      // open the stored conversation from the sidebar by clicking its title
      const opened = await evalJs(
        cdp,
        sessionId,
        `(async () => {
        const deadline = Date.now() + 20000;
        while (Date.now() < deadline) {
          const el = [...document.querySelectorAll('button,a,li,div')].find(e => (e.textContent||'').trim() === 'xss-probe');
          if (el) { el.click(); return true; }
          await new Promise(r => setTimeout(r, 300));
        }
        return false;
      })()`,
      );
      await sleep(3000);
      const xssResult = await evalJs(
        cdp,
        sessionId,
        `JSON.stringify({
        opened: ${opened},
        imgFired: typeof window.__xss_img !== 'undefined',
        scriptFired: typeof window.__xss_script !== 'undefined',
        linkFired: typeof window.__xss_link !== 'undefined',
        liveImgWithSrcX: !!document.querySelector('img[src="x"]'),
        injectedScriptEl: [...document.querySelectorAll('script')].some(s => (s.textContent||'').includes('__xss_script')),
        payloadVisibleAsText: (document.body.innerText||'').includes('onerror'),
        jsHrefAnchor: [...document.querySelectorAll('a')].some(a => (a.getAttribute('href')||'').toLowerCase().startsWith('javascript:'))
      })`,
      );
      results.tests.storedXss = JSON.parse(xssResult);
      console.log('B. stored-XSS result:', xssResult);
      const shotB = await cdp.send(
        'Page.captureScreenshot',
        { format: 'png' },
        sessionId,
      );
      writeFileSync(
        join(OUT, 'B-stored-xss-render.png'),
        Buffer.from(shotB.data, 'base64'),
      );
      await evalJs(
        cdp,
        sessionId,
        `fetch('/api/wazuh_ai_assistant/conversations/${xssId}', { method:'DELETE', headers:{'osd-xsrf':'true'} }).then(r=>r.status)`,
      );
    }

    // ---- TEST C: per-origin concurrent-stream cap ----
    if (PROVIDER) {
      const capJson = await evalJs(
        cdp,
        sessionId,
        `(async () => {
        const n = ${STREAMS};
        const t0 = performance.now();
        const runs = Array.from({length:n}, (_, i) => (async () => {
          const started = performance.now();
          try {
            const res = await fetch('/api/wazuh_ai_assistant/chat', { method:'POST',
              headers:{'Content-Type':'application/json','osd-xsrf':'true'},
              body: JSON.stringify({ providerId: ${JSON.stringify(PROVIDER)},
                messages:[{ role:'user', content: 'probe ' + i + ' [[mock:stream:400:12000]]' }] }) });
            const reader = res.body.getReader();
            const first = await reader.read();               // first byte arrives only once a slot frees
            const ttfb = performance.now() - started;
            reader.cancel();
            return { i, status: res.status, ttfbMs: Math.round(ttfb), bytes: first.value ? first.value.length : 0 };
          } catch (e) { return { i, error: String(e).slice(0,120), ttfbMs: Math.round(performance.now()-started) }; }
        })());
        const out = await Promise.all(runs);
        return JSON.stringify({ totalMs: Math.round(performance.now()-t0), runs: out });
      })()`,
      );
      const cap = JSON.parse(capJson);
      const sorted = cap.runs
        .filter(r => r.ttfbMs != null)
        .sort((a, b) => a.ttfbMs - b.ttfbMs);
      const fast = sorted.filter(r => r.ttfbMs < 3000).length;
      results.tests.connectionCap = {
        requested: STREAMS,
        promptFirstByte: fast,
        totalMs: cap.totalMs,
        runs: cap.runs,
      };
      console.log(
        `C. concurrent streams: ${STREAMS} requested, ${fast} got first byte promptly (<3s) — the rest queued`,
      );
      console.log('   ttfb ms:', sorted.map(r => r.ttfbMs).join(', '));
    } else {
      console.log('C. skipped (set PROBE_PROVIDER)');
    }

    // ---- TEST D: heap growth across UI-driven turns ----
    if (PROVIDER) {
      await cdp.send(
        'Page.navigate',
        { url: `${BASE}/app/wazuhAiAssistant` },
        sessionId,
      );
      await waitFor(
        cdp,
        sessionId,
        'document.querySelector("textarea") !== null',
        90000,
        'chat UI for turns',
      );
      await sleep(2000);
      const before = await evalJs(
        cdp,
        sessionId,
        'performance.memory ? performance.memory.usedJSHeapSize : null',
      );
      const perTurn = [];
      for (let t = 0; t < TURNS; t++) {
        await evalJs(
          cdp,
          sessionId,
          'document.querySelector("textarea").focus(); true',
        );
        await cdp.send(
          'Input.insertText',
          { text: `turn ${t} show me recent alerts [[mock:stream:600:1200]]` },
          sessionId,
        );
        await sleep(300);
        for (const type of ['keyDown', 'keyUp']) {
          await cdp.send(
            'Input.dispatchKeyEvent',
            {
              type,
              key: 'Enter',
              code: 'Enter',
              windowsVirtualKeyCode: 13,
              nativeVirtualKeyCode: 13,
            },
            sessionId,
          );
        }
        await sleep(4000);
        const h = await evalJs(
          cdp,
          sessionId,
          'performance.memory ? performance.memory.usedJSHeapSize : null',
        );
        perTurn.push(h);
      }
      const bubbles = await evalJs(
        cdp,
        sessionId,
        'document.querySelectorAll("textarea") ? (document.body.innerText.match(/turn \\d/g)||[]).length : 0',
      );
      results.tests.turnHeap = {
        beforeBytes: before,
        perTurnBytes: perTurn,
        turnsEchoedInDom: bubbles,
      };
      const growthMb =
        before && perTurn.at(-1)
          ? ((perTurn.at(-1) - before) / 1048576).toFixed(1)
          : '?';
      console.log(
        `D. heap across ${TURNS} UI turns: ${
          before ? (before / 1048576).toFixed(1) : '?'
        } MB -> ${
          perTurn.at(-1) ? (perTurn.at(-1) / 1048576).toFixed(1) : '?'
        } MB (+${growthMb} MB), turns visible in DOM: ${bubbles}`,
      );
      const shotD = await cdp.send(
        'Page.captureScreenshot',
        { format: 'png' },
        sessionId,
      );
      writeFileSync(
        join(OUT, 'D-after-turns.png'),
        Buffer.from(shotD.data, 'base64'),
      );
    } else {
      console.log('D. skipped (set PROBE_PROVIDER)');
    }

    // ---- TEST E: session-expired callout (clear cookies, then send) ----
    try {
      await cdp.send('Network.enable', {}, sessionId);
      await cdp.send('Network.clearBrowserCookies', {}, sessionId);
      await evalJs(
        cdp,
        sessionId,
        'document.querySelector("textarea").focus(); true',
      );
      await cdp.send(
        'Input.insertText',
        { text: 'this should 401' },
        sessionId,
      );
      for (const type of ['keyDown', 'keyUp']) {
        await cdp.send(
          'Input.dispatchKeyEvent',
          {
            type,
            key: 'Enter',
            code: 'Enter',
            windowsVirtualKeyCode: 13,
            nativeVirtualKeyCode: 13,
          },
          sessionId,
        );
      }
      await sleep(4000);
      const expired = await evalJs(
        cdp,
        sessionId,
        `JSON.stringify({
        calloutText: (document.body.innerText.match(/session expired[^\\n]*/i)||[])[0] || null,
        hasReloadButton: [...document.querySelectorAll('button')].some(b => /reload/i.test(b.textContent||''))
      })`,
      );
      results.tests.sessionExpired = JSON.parse(expired);
      console.log('E. session-expired UI:', expired);
      const shotE = await cdp.send(
        'Page.captureScreenshot',
        { format: 'png' },
        sessionId,
      );
      writeFileSync(
        join(OUT, 'E-session-expired.png'),
        Buffer.from(shotE.data, 'base64'),
      );
    } catch (e) {
      results.tests.sessionExpired = { error: String(e).slice(0, 200) };
      console.log('E. session-expired test error:', String(e).slice(0, 200));
    }
  } finally {
    writeFileSync(join(OUT, 'results.json'), JSON.stringify(results, null, 2));
    cdp.close();
    try {
      proc.kill();
    } catch {}
    console.log(`\nresults + screenshots: ${OUT}`);
  }
}

main().catch(e => {
  console.error('PROBE FAILED:', e.message);
  process.exit(1);
});
