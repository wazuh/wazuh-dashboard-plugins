import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../../src/core/server';

/**
 * Manager-host resolution, shared by server/tools/executor.ts
 * (every Manager API call) and server/routes/settings.ts's access probe. Split out from
 * executor.ts into its own module so other modules can import it without a registry.ts ->
 * catalog/*.ts -> executor.ts -> registry.ts circular import (executor.ts imports
 * `getToolDefinition` from registry.ts, which imports every catalog module).
 */

/** RFC 6265 §4.1.1 allows a cookie-value to be wrapped
 * in a DQUOTE...DQUOTE pair (`cookie-value = *cookie-octet / ( DQUOTE *cookie-octet DQUOTE )`) --
 * a `Set-Cookie: wz-api="host-1"` is exactly as valid as the unquoted form and must resolve to the
 * same id. `parseCookie` below previously returned the quoted form VERBATIM (`"host-1"`, quotes
 * included), which could never match a real configured host id. Stripped
 * AFTER `decodeURIComponent` so a percent-encoded quote (`%22value%22`) is handled identically to a
 * literal one. */
function stripQuotedCookieValue(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}

function parseCookie(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }
  for (const part of cookieHeader.split(';')) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    if (part.slice(0, separatorIndex).trim() !== name) {
      continue;
    }
    const rawValue = part.slice(separatorIndex + 1).trim();
    try {
      return stripQuotedCookieValue(decodeURIComponent(rawValue));
    } catch {
      return stripQuotedCookieValue(rawValue);
    }
  }
  return undefined;
}

/**
 * Resolves which Manager host to call. Mirrors the official dashboard: the `wz-api` cookie set at
 * login pins the user's selected host; falls back to the first configured host (`manageHosts.get()`
 * with no id) when the cookie is absent — e.g. a session predating host selection — OR
 * when it is present but not a recognized host id.
 *
 * Verified against the official plugin source (v4.14.6, unchanged in the 5.0.0-beta3
 * reference): `wz-api` cookie = the selected API host id (security-factory.ts:70);
 * `manageHosts.get()` called with no argument
 * returns the full host array (wazuh-check-updates get-updates.ts:52's usage), `get(id)` a single
 * host. The first-host fallback when `wz-api` is absent is this plugin's OWN choice, not something
 * the official flow does — the official login flow always sets `wz-api` at login, so that path
 * never actually falls through in practice; this fallback only covers a session that predates it.
 *
 * Client-supplied cookie trusted unvalidated: this
 * function used to return `fromCookie` verbatim with no check that it names a host this deployment
 * actually configured — a client can set an arbitrary `wz-api` cookie value (it is an ordinary,
 * non-HttpOnly-enforced browser cookie, not a signed/server-only token), and that value flowed
 * straight into every Manager API call's `{apiHostID: ...}` option (server/tools/executor.ts).
 * `manageHosts.get()` with no id (verified above) already enumerates every configured host, so
 * full validation IS available here — no need to fall back to a weaker format-only check: the
 * cookie value is now cross-checked against that real list, and an id that doesn't match any
 * configured host degrades to the exact same first-host default used when the cookie is absent,
 * rather than being handed to the Manager-facing client unchecked. Both branches share this same
 * one `manageHosts.get()` call/host list (previously only fetched on the fallback path) so
 * validating unconditionally costs one extra await per request in the "valid cookie" case, in
 * exchange for closing the gap.
 */
export async function resolveApiHostId(
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
): Promise<string> {
  const rawCookie = (request.headers ?? {}).cookie;
  const cookieHeader = typeof rawCookie === 'string' ? rawCookie : undefined;
  const fromCookie = parseCookie(cookieHeader, 'wz-api');

  const hosts = await context.wazuh_core.manageHosts.get();
  const list = Array.isArray(hosts) ? hosts : [hosts];
  const first = list[0];
  if (!first?.id) {
    throw new Error('No Wazuh manager host is configured.');
  }

  if (fromCookie && list.some(host => host?.id === fromCookie)) {
    return fromCookie;
  }
  // Absent cookie (pre-existing behavior) OR present-but-unrecognized cookie: both fall
  // back to the same first-configured-host default rather than trusting an unvalidated value.
  return first.id;
}
