import { HttpSetup } from '../../../../src/core/public';

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
