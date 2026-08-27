import { HttpSetup } from '../../../../src/core/public';
import { API_PATHS } from '../../common/constants';

/** Response shape of GET /settings/access (server/routes/settings.ts's Manager-session liveness
 * probe — NOT an authorization check; settings/providers are authorized by the Wazuh indexer's own
 * RBAC on the calling user, see docs/ref/modules/ai-assistant/security.md). */
export interface SettingsAccess {
  managerSessionOk: boolean;
  message: string | null;
  defaultApiHostId: string | null;
  apiKeyEncryptionEnabled: boolean;
  /** `true` when `wazuh_ai_assistant.settingsReadOnly` is set server-side — the Settings page
   * disables every write control and shows a banner instead of relying only on the server's
   * 403 (server/routes/settings.ts's `requireSettingsUnlocked`). */
  settingsLocked: boolean;
}

/**
 * Client-side session auto-heal: opening this app directly —
 * without ever visiting the main Wazuh app in this browser session — leaves no `wz-token` cookie
 * set, so every live Manager probe (`isAdministratorUser`, and every Manager-path tool call) 401s
 * even for a genuine administrator. The main Wazuh (wazuh-core reference) plugin's OWN login route,
 * `POST {basePath}/api/login` with body `{"idHost": "<host id>"}`, is what the main app calls on
 * every page load to (re)establish that cookie — this function calls the SAME route from here, so
 * a direct deep link into this plugin can silently repair the session without the user ever having
 * to open the main Wazuh app first.
 *
 * `http.post` (not raw `fetch`) is required: it auto-prepends `basePath` and attaches the
 * `osd-xsrf` header the OSD server-side XSRF check requires, exactly like every other call this
 * plugin makes through its own services.
 *
 * The wazuh-core/wazuh plugin is registered as an `optionalPlugin` — it may not be installed at
 * all, in which case this route simply doesn't exist. That, a network failure, and any non-2xx
 * rejection from the Manager itself (wrong/stale host id, Manager unreachable, etc.) are all
 * equally "could not heal" from this function's point of view: it NEVER throws, resolving `false`
 * for any of them, so a caller can always fire-and-forget or `await` this without its own try/catch.
 */
export async function healManagerSession(
  http: HttpSetup,
  idHost: string,
): Promise<boolean> {
  try {
    await http.post('/api/login', { body: JSON.stringify({ idHost }) });
    return true;
  } catch {
    return false;
  }
}

/** Memo of the last settled probe so rapid repeat callers (e.g. chat sends) can skip the network. */
let lastResult: SettingsAccess | null = null;
let lastResultAt = 0;
/** Concurrent callers share one probe→heal→re-probe execution instead of racing their own. */
let inFlight: Promise<SettingsAccess | null> | null = null;

export function resetManagerSessionStateForTesting(): void {
  lastResult = null;
  lastResultAt = 0;
  inFlight = null;
}

function memoize(access: SettingsAccess): void {
  lastResult = access;
  lastResultAt = Date.now();
}

async function runEnsureManagerSession(
  http: HttpSetup,
): Promise<SettingsAccess | null> {
  let access: SettingsAccess;
  try {
    access = await http.get<SettingsAccess>(API_PATHS.SETTINGS_ACCESS);
  } catch {
    lastResult = null;
    return null;
  }
  // Only a token-shaped failure with a known host is healable; anything else (session OK, no
  // configured host) is returned as-is so no pointless /api/login is ever posted.
  const healHostId = !access.managerSessionOk ? access.defaultApiHostId : null;
  if (!healHostId) {
    memoize(access);
    return access;
  }
  const healed = await healManagerSession(http, healHostId);
  if (!healed) {
    // Un-memoized on purpose: the next caller should retry the heal, not reuse this failure.
    return access;
  }
  try {
    const reprobed = await http.get<SettingsAccess>(API_PATHS.SETTINGS_ACCESS);
    memoize(reprobed);
    return reprobed;
  } catch {
    return access;
  }
}

/**
 * Ensures the Manager API session cookies exist before Manager-path work (chat's tool calls):
 * probes GET /settings/access and, when `managerSessionOk` comes back false, heals via
 * `healManagerSession` and re-probes. Resolves the freshest access result, or `null` when the
 * probe itself failed (fail-open). Never rejects.
 * `maxAgeMs` returns the memoized result without any network call when it is recent enough.
 */
export function ensureManagerSession(
  http: HttpSetup,
  options?: { maxAgeMs?: number },
): Promise<SettingsAccess | null> {
  const maxAgeMs = options?.maxAgeMs;
  if (
    maxAgeMs !== undefined &&
    lastResult !== null &&
    Date.now() - lastResultAt <= maxAgeMs
  ) {
    return Promise.resolve(lastResult);
  }
  if (!inFlight) {
    inFlight = runEnsureManagerSession(http).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
