/**
 * Augmentation of the OSD request-handler context contributed by the `wazuh-core` plugin.
 * wazuh-core registers this context via
 * `core.http.registerRouteHandlerContext('wazuh_core', ...)`
 * which makes `context.wazuh_core` available to every
 * plugin's route handlers, including ours, without a runtime dependency declaration. wazuh-core
 * ships no published ambient-module augmentation for this context surface itself (its own `main`
 * plugin consumes it untyped too), so the `declare module` block below has to stay local — but its
 * member types are now sourced from wazuh-core's real exported types wherever those are compatible
 * with how this plugin actually calls them (see the per-member notes).
 *
 * Shape verified against v4.14.6 (server-api-client.ts, manage-hosts.ts), re-confirmed unchanged
 * in v5.0.0-beta3 (wdp-5):
 * `request()` is axios-backed — it REJECTS (throws) on non-2xx responses and resolves with an
 * axios response (`{data, status, ...}`); its `data` argument is destructured as
 * `{body, params, headers, ...rest}`, so query-string values MUST be passed under `data.params`
 * (top-level keys would be sent as a request body the Manager ignores on GET).
 * `manageHosts.get()` with no id resolves to the full `IAPIHost[]` array from host config, which
 * Wazuh 5.0 moved out of wazuh.yml and into `opensearch_dashboards.yml`'s `wazuh_core.hosts`.
 *
 * `dashboardSecurity.isAdministratorUser` shape VERIFIED against the same v4.14.6 reference clone's
 * `main/controllers/decorators.ts` (`routeDecoratorProtectedAdministrator`): it reads the
 * `wz-token` cookie's JWT `rbac_roles` claim for the request and resolves administrator status
 * from it, returning a human-readable `administrator_requirements` message for the 403 case. This
 * is the exact mechanism the reference plugin uses to protect its own administrator-only routes.
 */

import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
} from '../../../src/core/server';
interface WazuhCoreApiResponse {
  data: unknown;
  status: number;
}

interface WazuhCoreManageHostsEntry {
  id: string;
  [key: string]: unknown;
}

/**
 * Structurally matches wazuh-core's real `ManageHosts`
 * (`wazuh-core/server/services/manage-hosts`), and is declared locally rather than imported from
 * it on purpose. This plugin runs a `yarn typecheck` gate that the sibling plugins do not have, and
 * importing from `../../wazuh-core/server/**` pulls that plugin's `.ts` sources into this program:
 * `skipLibCheck` does not apply to them, so ~49 of wazuh-core's own pre-existing type errors would
 * be reported against THIS plugin's gate. Re-verify this declaration against manage-hosts.ts when
 * upgrading wazuh-core.
 */
interface WazuhCoreManageHosts {
  /** No `hostId` returns every configured host; used here only to find a fallback default. */
  get(
    hostId?: string,
    options?: { excludePassword?: boolean },
  ): Promise<WazuhCoreManageHostsEntry[] | WazuhCoreManageHostsEntry>;
}

/**
 * Kept local: wazuh-core's real client types for this surface
 * (`ServerAPIScopedUserClient`/`ServerAPIInternalUserClient` in
 * `wazuh-core/server/services/server-api-client.ts`) type `request`'s `options` as
 * `APIInterceptorRequestOptions{Scoped,Internal}User`, and the scoped-user variant (what
 * `asCurrentUser` actually is — see the `declare module` block below) requires a `token: string`
 * field. Every call site in this plugin (server/tools/executor.ts's
 * `context.wazuh_core.api.client.asCurrentUser.request(method, path, data, { apiHostID })`) passes
 * only `apiHostID`, relying on `asScoped`'s closure to inject the token from the `wz-token` cookie
 * itself (server-api-client.ts's `asScoped`). Adopting the real type would make that call site fail
 * to typecheck (`Property 'token' is missing`), so this narrower, call-site-accurate shape stays
 * hand-written instead.
 */
interface WazuhCoreApiUserClient {
  /** Pass query params as `data.params` and request bodies as `data.body` (axios-destructured). */
  request(
    method: string,
    path: string,
    data: { params?: Record<string, unknown>; body?: Record<string, unknown> },
    options: { apiHostID: string },
  ): Promise<WazuhCoreApiResponse>;
}

/**
 * Kept local: wazuh-core's real `ISecurityFactory` (`wazuh-core/server/services/security-factory`)
 * types `isAdministratorUser` as returning `Promise<void>` — its actual behavior is patched on at
 * runtime by `createDashboardSecurity`'s `enhanceDashboardSecurity` helper (security-factory.ts),
 * which resolves `{administrator: boolean, administrator_requirements: string | null}` instead; the
 * interface was never updated to match. `server/routes/settings.ts`'s `checkAdministrator`
 * destructures both fields from the resolved value, so importing the real (stale) return type would
 * break that destructuring. This hand-written shape reflects the real runtime contract rather than
 * the out-of-date published interface.
 */
interface WazuhCoreDashboardSecurity {
  /**
   * Resolves whether the current request is authenticated as a Wazuh administrator (see the file
   * doc comment above for the verified reference mechanism). Used by server/routes/settings.ts's
   * PUT handler to gate the AI Assistant settings singleton — the only write route in this
   * plugin that changes plugin-wide security posture (privacy defaults, field policy) and
   * therefore must not be reachable by every authenticated dashboard user.
   */
  isAdministratorUser(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
  ): Promise<{
    administrator: boolean;
    administrator_requirements: string | null;
  }>;
}

declare module '../../../src/core/server' {
  interface RequestHandlerContext {
    wazuh_core: {
      api: {
        client: {
          asCurrentUser: WazuhCoreApiUserClient;
          asInternalUser: WazuhCoreApiUserClient;
        };
      };
      manageHosts: WazuhCoreManageHosts;
      dashboardSecurity: WazuhCoreDashboardSecurity;
    };
  }
}

export {};
