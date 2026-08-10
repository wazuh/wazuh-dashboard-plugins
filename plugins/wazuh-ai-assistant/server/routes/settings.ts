import * as crypto from 'crypto';
import { schema, Type } from '@osd/config-schema';
import {
  IRouter,
  Logger,
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
  IOpenSearchDashboardsResponse,
  RequestHandlerContext,
} from '../../../../src/core/server';
import {
  API_PATHS,
  MANAGER_SESSION_EXPIRED_COPY,
  PROVIDER_TYPES,
} from '../../common/constants';
import { ProviderConfig, ProviderSummary } from '../../common/types';
import { describeError } from '../../common/errors';
import { getProviderAdapter } from '../providers/registry';
import { assertProviderUrlAllowed } from '../providers/url-guard';
import {
  AssistantSettingsAttributes,
  countProviders,
  createProvider,
  createSettings,
  deleteProvider,
  getProvider,
  getSettings,
  listProviders,
  setProviderDefault,
  StoredProviderAttributes,
  updateProvider,
  updateSettings,
} from '../settings-store';
import { FIELD_POLICY_DEFAULTS } from '../tools/privacy';
import { getApiKeyCipher } from '../plugin-services';
import { isEncrypted } from '../crypto/api-key-cipher';
import { resolveApiHostId } from '../tools/api-host';
import {
  paginationQuerySchema,
  resolvePagination,
  withInternalErrorHandling,
} from './route-helpers';

/** Keep saved conversations forever unless an admin opts into a retention window. */
const DEFAULT_CONVERSATION_RETENTION_DAYS = 0;

const DEFAULT_ASSISTANT_SETTINGS: AssistantSettingsAttributes = {
  privacyDefaultOn: false,
  privacyDefaultPerProvider: {},
  userCanOverride: true,
  fieldPolicy: FIELD_POLICY_DEFAULTS,
  conversationRetentionDays: DEFAULT_CONVERSATION_RETENTION_DAYS,
};

/**
 * Fetches the `.wazuh-ai-assistant-settings` singleton document, creating it with defaults on
 * first access (the GET route's documented "create-with-defaults if absent" behavior). Exported so
 * server/routes/chat.ts can resolve the same, always-consistent settings object when deciding
 * whether privacy mode is active for a turn, without duplicating this create-on-miss logic.
 *
 * Takes `context` (not a client): `server/settings-store.ts`'s `getSettings`/`createSettings` read
 * and bootstrap through the INTERNAL user, not the calling dashboard user's own OpenSearch
 * identity — see that module's doc comment for why (this must succeed for every authenticated
 * user, not just admin/wazuh-admin backend roles).
 *
 * Default-fills `conversationRetentionDays` for any document created before that field existed:
 * such a document's `settings.conversationRetentionDays` is simply absent from `_source`, so
 * reading it here yields `undefined` rather than throwing — falling back to
 * `DEFAULT_CONVERSATION_RETENTION_DAYS` (keep forever) keeps every existing deployment behaving
 * exactly as before the field landed. A stored `actions` block from a build that still shipped
 * mutating tools is simply ignored (never read, never re-written).
 */
export async function getOrCreateAssistantSettings(
  context: RequestHandlerContext,
): Promise<AssistantSettingsAttributes> {
  const found = await getSettings(context);
  if (found === undefined) {
    // getSettings() returning undefined on a missing singleton id is the only "not found" case
    // this store function surfaces (see its own doc comment) — create it with defaults.
    return createSettings(context, DEFAULT_ASSISTANT_SETTINGS);
  }
  // Previously only
  // `conversationRetentionDays` was defaulted here; the other four fields were read with no
  // fallback at all, so a document missing any of them (e.g. written by a build predating that
  // field) would surface `undefined` here. server/routes/chat.ts's `resolvePrivacyEnabled` does
  // `settings.privacyDefaultPerProvider[providerId]` unconditionally, which would throw on an
  // `undefined` map (500 on every chat). Currently unreachable via the API (PUT's schema makes
  // every field mandatory and the route does a full merge update), so this is robustness/defense
  // in depth, not a live exploit -- but it brings this function in line with its own documented
  // "default-fill on read" policy for every field, not just one.
  return {
    privacyDefaultOn:
      found.privacyDefaultOn ?? DEFAULT_ASSISTANT_SETTINGS.privacyDefaultOn,
    privacyDefaultPerProvider:
      found.privacyDefaultPerProvider ??
      DEFAULT_ASSISTANT_SETTINGS.privacyDefaultPerProvider,
    userCanOverride:
      found.userCanOverride ?? DEFAULT_ASSISTANT_SETTINGS.userCanOverride,
    fieldPolicy: found.fieldPolicy ?? DEFAULT_ASSISTANT_SETTINGS.fieldPolicy,
    conversationRetentionDays:
      found.conversationRetentionDays ?? DEFAULT_CONVERSATION_RETENTION_DAYS,
  };
}

function toSummary(
  id: string,
  attributes: StoredProviderAttributes,
): ProviderSummary {
  return {
    id,
    name: attributes.name,
    type: attributes.type,
    baseUrl: attributes.baseUrl,
    model: attributes.model,
    hasApiKey: Boolean(attributes.apiKey),
    isDefault: Boolean(attributes.isDefault),
  };
}

/**
 * Clears `isDefault` on every provider except `keepId`. Providers are capped at ~200 (see the
 * `perPage` used for `listProviders` below), so a plain list+update loop is fine here; no bulk
 * update API is used because the index has no partial "update where" primitive of its own.
 * The list read goes through the internal user (`listProviders`); each clearing write goes through
 * the current user (`setProviderDefault`) — see server/settings-store.ts's doc comment.
 */
async function clearOtherDefaults(
  context: RequestHandlerContext,
  keepId: string,
): Promise<void> {
  const { providers } = await listProviders(context, 1, 200);
  await Promise.all(
    providers
      .filter(
        provider => provider.id !== keepId && provider.attributes.isDefault,
      )
      .map(provider => setProviderDefault(context, provider.id, false)),
  );
}

// @osd/config-schema's oneOf() wants a tuple of literal schemas; PROVIDER_TYPES is generated from
// the shared constant so the two can't drift, but its length is only known at runtime, hence the
// tuple cast on the mapped array below.
// Annotated with the real literal union: PROVIDER_TYPES is derived from the same ProviderConfig
// type, and the runtime only ever validates against those exact literals, so the schema genuinely
// produces a `ProviderConfig['type']` — no further cast needed once the tuple shape is asserted.
const providerTypeSchema: Type<ProviderConfig['type']> = schema.oneOf(
  PROVIDER_TYPES.map(type => schema.literal(type)) as [
    Type<ProviderConfig['type']>,
  ],
);

/**
 * Maps the reference plugin's `administratorRequirements` string (server/wazuh-core.d.ts's
 * `isAdministratorUser`) to a message that tells the user what to DO, not just that they were
 * rejected. The real-world failure for a genuine admin is almost always "opened this app without
 * the main Wazuh app ever running its /api/login in this browser session" — no `wz-token` cookie
 * yet — rather than an actual permissions problem, so that family of reasons gets its own,
 * actionable copy; a real permissions problem gets different, equally actionable copy; anything
 * else falls back to a generic administrator-required message with the raw reason appended so it
 * is never silently swallowed. The raw `administratorRequirements` string is always included in
 * parentheses so a report from a user still carries the exact reference-plugin reason.
 */
function tokenMissingOrExpiredMessage(
  administratorRequirements: string | null,
): string {
  return (
    // Built from MANAGER_SESSION_EXPIRED_COPY so the client-side heal/retry trigger
    `Your Wazuh Manager API ${MANAGER_SESSION_EXPIRED_COPY}. Open any page of the main Wazuh ` +
    'app (or reload and log in again) to establish it, then retry saving. ' +
    `(${administratorRequirements})`
  );
}

/**
 * Catch-all: opening this app directly (without ever visiting the main
 * Wazuh app in this browser session) makes `isAdministratorUser`'s own live Manager probe 401 —
 * the reference plugin then surfaces that as a free-form string like "It could not check if the
 * current user is administrator due to: Request failed with status code 401", which is NOT one of
 * the three exact literals the switch above matches, so without this it falls into the generic
 * message despite being the same "no/expired wz-token" situation. Matches
 * on the two observed shapes of that family: a bare "status code 401", or "could not check" paired
 * with "401" anywhere in the string (case-sensitive, matching the reference plugin's own casing).
 */
function isTokenMissingOr401(administratorRequirements: string): boolean {
  return (
    administratorRequirements.includes('status code 401') ||
    (administratorRequirements.includes('could not check') &&
      administratorRequirements.includes('401'))
  );
}

/** Exported for unit testing only — every other caller in this file uses it directly. */
export function describeAdministratorRequirement(
  administratorRequirements: string | null,
): string {
  switch (administratorRequirements) {
    case 'No token provider':
    case 'Token is not valid':
    case 'No API id provided':
      return tokenMissingOrExpiredMessage(administratorRequirements);
    case 'No administrator role':
    case 'No permissions in token':
      return (
        'Your Wazuh Manager API user does not have the administrator role, which is required to ' +
        `change AI Assistant settings. (${administratorRequirements})`
      );
    default:
      if (
        administratorRequirements &&
        isTokenMissingOr401(administratorRequirements)
      ) {
        return tokenMissingOrExpiredMessage(administratorRequirements);
      }
      return (
        'Administrator privileges are required to change AI Assistant settings.' +
        (administratorRequirements ? ` (${administratorRequirements})` : '')
      );
  }
}

/**
 * Runs the reference plugin's administrator check and ALWAYS resolves — never throws — a
 * `{administrator: true}` or `{administrator: false, message}` pair, where `message` is the
 * actionable text from `describeAdministratorRequirement` above.
 * Shared by:
 *  - the PUT /settings admin gate below, which turns a `false` into a 403 response;
 *  - GET /settings/access (pre-flight probe), which the Settings page calls on mount so it
 *    can warn the user and disable Save buttons BEFORE they attempt (and get rejected by) the real
 *    PUT.
 * Fails CLOSED like the original inline try/catch did: any throw from `isAdministratorUser` itself
 * (wazuh_core context drift, not a real admin-vs-not-admin answer) is treated as "not an
 * administrator", but with a message that says the CHECK failed, not that the user lacks
 * privileges — those are different problems and deserve different copy.
 */
async function checkAdministrator(
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
): Promise<
  { administrator: true } | { administrator: false; message: string }
> {
  try {
    const {
      administrator,
      administrator_requirements: administratorRequirements,
    } = await context.wazuh_core.dashboardSecurity.isAdministratorUser(
      context,
      request,
    );
    // The upstream contract
    // types `administrator` as boolean but enforces nothing about it at runtime -- a plain JS
    // truthiness check (`if (administrator)`) would grant admin for ANY truthy value, including a
    // non-boolean like the string "false" (truthy in JS despite its name). Require the literal
    // value `true` so only an actual boolean true grants access.
    if (administrator === true) {
      return { administrator: true };
    }
    return {
      administrator: false,
      message: describeAdministratorRequirement(administratorRequirements),
    };
  } catch {
    return {
      administrator: false,
      message:
        'The administrator check itself could not be performed (the Wazuh core plugin did not ' +
        'respond as expected), so this request was rejected as a precaution. Try again, and ' +
        'contact your Wazuh administrator if this persists.',
    };
  }
}

/**
 * Shared admin gate for the five provider mutation/test routes:
 * resolves to the same `response.forbidden(...)` value PUT /settings's own inline gate below
 * returns when the caller is not an administrator, or `null` when the caller may proceed. Every
 * gated route calls this as the very FIRST thing in its handler, before any store work — mirroring
 * PUT /settings's inline `checkAdministrator` + `forbidden` pattern exactly, just
 * centralized once so five call sites can't drift from each other.
 * Fails CLOSED like `checkAdministrator` itself: any unexpected/thrown result is never treated as
 * "proceed".
 * Exported for unit testing only (same convention as `describeAdministratorRequirement` above);
 * every other caller in this file uses it directly. There is no request/response mocking harness
 * for full route-level HTTP tests in this plugin, and this single gate is the smallest seam that
 * proves all five routes reject a non-administrator and admit an administrator.
 */
export async function requireAdministrator(
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
  response: OpenSearchDashboardsResponseFactory,
): Promise<IOpenSearchDashboardsResponse | null> {
  const result = await checkAdministrator(context, request);
  if (!result.administrator) {
    return response.forbidden({ body: { message: result.message } });
  }
  return null;
}

/** Backstop for direct API calls — the UI blocks these writes first (see the access probe's
 * `apiKeyEncryptionEnabled`). Keep short; never reference repo files. */
export const ENCRYPTION_REQUIRED_MESSAGE =
  'API keys cannot be saved: encryption at rest is not configured, so the key would be stored ' +
  'in plain text. Generate a base64-encoded 32-byte key (e.g. `openssl rand -base64 32`) and ' +
  'store it as `wazuh_ai_assistant.encryptionKey` — either with `opensearch-dashboards-keystore ' +
  'add wazuh_ai_assistant.encryptionKey` (recommended) or in `opensearch_dashboards.yml` — then ' +
  'restart dashboard service and try again.';

/** Refuses a non-empty `apiKey` when no encryption key is configured. See docs/ENCRYPTION.md. */
export function requireApiKeyEncryption(
  apiKey: string | undefined,
  response: OpenSearchDashboardsResponseFactory,
): IOpenSearchDashboardsResponse | null {
  if (!apiKey || apiKey.length === 0) {
    return null;
  }
  if (getApiKeyCipher().enabled) {
    return null;
  }
  return response.customError({
    statusCode: 503,
    body: { message: ENCRYPTION_REQUIRED_MESSAGE },
  });
}

export function registerSettingsRoutes(router: IRouter, logger: Logger): void {
  // List all configured providers. API keys never leave the server. Paginated:
  // `page`/`perPage` query params, response carries `total`/`page`/`perPage` alongside `providers` —
  // public/services/settings-service.ts's `list()` loops pages to keep showing the full set.
  router.get(
    { path: API_PATHS.PROVIDERS, validate: { query: paginationQuerySchema } },
    withInternalErrorHandling(async (context, request, response) => {
      const { page, perPage } = resolvePagination(request.query);
      const { providers, total } = await listProviders(context, page, perPage);
      return response.ok({
        body: {
          providers: providers.map(provider =>
            toSummary(provider.id, provider.attributes),
          ),
          total,
          page,
          perPage,
        },
      });
    }),
  );

  // Create a provider. The first provider ever created automatically becomes the default;
  // any later provider explicitly created with isDefault=true takes over as the sole default.
  router.post(
    {
      path: API_PATHS.PROVIDERS,
      validate: {
        body: schema.object({
          name: schema.string({ minLength: 1 }),
          type: providerTypeSchema,
          baseUrl: schema.string({ minLength: 1 }),
          model: schema.string({ minLength: 1 }),
          apiKey: schema.maybe(schema.string()),
          isDefault: schema.maybe(schema.boolean()),
        }),
      },
    },
    withInternalErrorHandling(async (context, request, response) => {
      // Administrator-only, gated before any store work: creating a provider
      // sets the endpoint the server itself will call.
      const gate = await requireAdministrator(context, request, response);
      if (gate) {
        return gate;
      }
      // SSRF fail-fast. The fetch-time guard inside each adapter remains the security-critical
      // check — it re-validates on every request, including configs saved by an earlier version —
      // but rejecting an obviously-bad baseUrl at save time gives the admin an immediate,
      // actionable 400 instead of a confusing later "provider test failed".
      try {
        await assertProviderUrlAllowed(request.body.baseUrl);
      } catch (error) {
        return response.badRequest({ body: { message: describeError(error) } });
      }
      // Refuse plaintext before any document write.
      const encryptionGate = requireApiKeyEncryption(
        request.body.apiKey,
        response,
      );
      if (encryptionGate) {
        return encryptionGate;
      }
      const isFirstProvider = (await countProviders(context)) === 0;
      const isDefault = isFirstProvider || Boolean(request.body.isDefault);
      // THE CREATE-BEFORE-ID PROBLEM (AAD binding, server/crypto/api-key-cipher.ts): `enc:v1:`
      // binds the ciphertext to the document's id, but a plain `index` call with no explicit id
      // would let OpenSearch MINT that id — normally not known until after the call returns.
      // Rather than create-then-update (two writes, with a real "provider left with no key"
      // failure window if the second write fails), this pre-generates the id client-side with
      // `crypto.randomUUID()` and passes it through `createProvider(context, providerId, attrs)`
      // (`op_type: 'create'` with an explicit id — server/settings-store.ts), the SAME
      // explicit-id create contract this file already relies on elsewhere
      // (`getOrCreateAssistantSettings` above creates the settings singleton with the fixed id
      // `ASSISTANT_SETTINGS_ID`), so this is a proven-working call shape, not a new assumption.
      // This keeps provider creation a SINGLE atomic write: either it fully succeeds (provider
      // exists, apiKey correctly bound to its own id from birth) or it fully fails (RandomUUID
      // collision against an existing id — astronomically unlikely — or any other write error)
      // and NOTHING is created, surfaced to the caller as the same 500
      // `withInternalErrorHandling` every other failure in this route already produces. There is
      // no partial/half-written state to reason about: no second write exists that could fail
      // after the first one succeeded.
      // Encryption-at-rest (server/crypto/api-key-cipher.ts): the encryption gate above
      // guarantees the cipher is enabled whenever a non-empty apiKey reaches this point.
      // `request.body.apiKey` is `schema.maybe(schema.string())`; an absent/empty value
      // stays absent/empty (encrypt() is only ever called with a truthy string).
      const providerId = crypto.randomUUID();
      const attributes: StoredProviderAttributes = {
        ...request.body,
        apiKey: request.body.apiKey
          ? getApiKeyCipher().encrypt(request.body.apiKey, providerId)
          : request.body.apiKey,
        isDefault,
      };
      await createProvider(context, providerId, attributes);
      if (isDefault) {
        await clearOtherDefaults(context, providerId);
      }
      return response.ok({ body: toSummary(providerId, attributes) });
    }),
  );

  // Update a provider. Sending an empty/absent apiKey keeps the previously stored one.
  // When isDefault is omitted, the provider's current default state is preserved.
  router.put(
    {
      path: API_PATHS.PROVIDER_BY_ID(`{id}`),
      validate: {
        params: schema.object({ id: schema.string() }),
        body: schema.object({
          name: schema.string({ minLength: 1 }),
          type: providerTypeSchema,
          baseUrl: schema.string({ minLength: 1 }),
          model: schema.string({ minLength: 1 }),
          apiKey: schema.maybe(schema.string()),
          isDefault: schema.maybe(schema.boolean()),
        }),
      },
    },
    withInternalErrorHandling(async (context, request, response) => {
      // Administrator-only, gated before any client work. This is the most sensitive mutation on
      // the route: omitting `apiKey` from the body keeps the stored key, so an unprivileged caller
      // able to change `baseUrl` alone would redirect the existing credential to a host of their
      // choosing.
      const gate = await requireAdministrator(context, request, response);
      if (gate) {
        return gate;
      }
      // SSRF fail-fast: see the identical comment on POST /providers above.
      try {
        await assertProviderUrlAllowed(request.body.baseUrl);
      } catch (error) {
        return response.badRequest({ body: { message: describeError(error) } });
      }
      // Same gate as POST /providers; only fires when the caller re-supplies a key.
      const encryptionGate = requireApiKeyEncryption(
        request.body.apiKey,
        response,
      );
      if (encryptionGate) {
        return encryptionGate;
      }
      const existing = await getProvider(context, request.params.id);
      if (!existing) {
        return response.notFound();
      }
      const cipher = getApiKeyCipher();
      let nextApiKey: string | undefined;
      if (request.body.apiKey && request.body.apiKey.length > 0) {
        // A new key was supplied: always encrypt it fresh (a new random IV every time — never
        // reuse or inspect any previous ciphertext for this provider), bound to this provider's
        // own (pre-existing, stable) id — no create-before-id problem here, unlike POST /providers
        // above.
        nextApiKey = cipher.encrypt(request.body.apiKey, request.params.id);
      } else if (
        existing.attributes.apiKey &&
        !isEncrypted(existing.attributes.apiKey)
      ) {
        // The stored key is legacy PLAINTEXT (never produced by this module — only ever left over
        // from a pre-release build). Managing a plaintext-stored key — even just to silently
        // upgrade it to ciphertext on an unrelated edit — is not supported: the request means
        // "keep the existing key" (empty/absent apiKey), so the only correct move is to refuse and
        // make the admin explicitly re-enter it (which then encrypts fresh via the branch above,
        // or 503s here again if encryption still isn't configured). Delete-and-recreate the
        // provider is the other option. Same 503 the create/re-supply paths return.
        return response.customError({
          statusCode: 503,
          body: { message: ENCRYPTION_REQUIRED_MESSAGE },
        });
      } else {
        // Keep the previously stored value untouched — it is either already encrypted (`enc:v1:`;
        // do NOT re-encrypt: encrypting an already-encrypted string again would wrap it as new
        // "plaintext", making it undecryptable as a real key later) or absent.
        nextApiKey = existing.attributes.apiKey;
      }
      const nextIsDefault =
        request.body.isDefault === undefined
          ? Boolean(existing.attributes.isDefault)
          : request.body.isDefault;
      // The update response only contains changed attributes, not the full object, so build the
      // summary from what we know was just written instead of re-reading it back.
      const nextAttributes: StoredProviderAttributes = {
        ...existing.attributes,
        ...request.body,
        apiKey: nextApiKey,
        isDefault: nextIsDefault,
      };
      await updateProvider(context, request.params.id, nextAttributes);
      if (nextIsDefault) {
        await clearOtherDefaults(context, request.params.id);
      }
      return response.ok({
        body: toSummary(request.params.id, nextAttributes),
      });
    }),
  );

  // Set a provider as the default, clearing the flag on every other provider.
  router.post(
    {
      path: API_PATHS.PROVIDER_SET_DEFAULT(`{id}`),
      validate: { params: schema.object({ id: schema.string() }) },
    },
    async (context, request, response) => {
      // Administrator-only, gated before any client work: the default provider applies to every
      // user of the deployment, so this setting is not the caller's own to change.
      const gate = await requireAdministrator(context, request, response);
      if (gate) {
        return gate;
      }
      const existing = await getProvider(context, request.params.id);
      if (!existing) {
        return response.notFound();
      }
      await setProviderDefault(context, request.params.id, true);
      await clearOtherDefaults(context, request.params.id);
      return response.ok({
        body: toSummary(request.params.id, {
          ...existing.attributes,
          isDefault: true,
        }),
      });
    },
  );

  // Delete a provider.
  router.delete(
    {
      path: API_PATHS.PROVIDER_BY_ID(`{id}`),
      validate: { params: schema.object({ id: schema.string() }) },
    },
    withInternalErrorHandling(async (context, request, response) => {
      // Administrator-only, gated before any store work: provider configuration is
      // deployment-wide state.
      const gate = await requireAdministrator(context, request, response);
      if (gate) {
        return gate;
      }
      await deleteProvider(context, request.params.id);
      return response.ok({ body: { deleted: true } });
    }),
  );

  // Minimal connectivity test: send a one-line "say ok" prompt through the real adapter and
  // measure round-trip latency, without exposing the API key back to the browser.
  router.post(
    {
      path: API_PATHS.PROVIDER_TEST(`{id}`),
      validate: { params: schema.object({ id: schema.string() }) },
    },
    async (context, request, response) => {
      // Administrator-only, gated before any client work: this route returns the provider's own
      // response to the caller, which makes it a read-capable SSRF primitive on top of the
      // url-guard's network restrictions.
      const gate = await requireAdministrator(context, request, response);
      if (gate) {
        return gate;
      }
      const stored = await getProvider(context, request.params.id);
      if (!stored) {
        return response.notFound();
      }
      // Decrypt-on-read: the document may hold `enc:v1:` ciphertext (AAD-bound to
      // `request.params.id`, the id this exact document was fetched by — see
      // server/crypto/api-key-cipher.ts). A decrypt failure here means a real misconfiguration
      // (ciphertext present but no/rotated encryptionKey or an AAD/id mismatch, the admin must re-enter it) — surfaced as a failed
      // test rather than crashing the route or leaking the raw stored value to the adapter.
      let apiKey: string | undefined;
      try {
        apiKey = stored.attributes.apiKey
          ? getApiKeyCipher().decrypt(
              stored.attributes.apiKey,
              request.params.id,
            )
          : stored.attributes.apiKey;
      } catch (error) {
        logger.error(
          `wazuhAiAssistant: failed to decrypt API key for provider ${
            request.params.id
          }: ${describeError(error)}`,
        );
        return response.ok({
          body: {
            success: false,
            latencyMs: 0,
            message:
              'Provider API key could not be decrypted. Check the server encryption key ' +
              'configuration.',
          },
        });
      }
      const config: ProviderConfig = {
        id: request.params.id,
        ...stored.attributes,
        apiKey,
      };
      // Explicit fail-fast check ahead of the adapter/timeout
      // dance below — this route calls a POSSIBLY-EXISTING stored baseUrl, which can predate this
      // fix even though create/update now validate it too. Each adapter's `chatStream` also runs
      // this same guard internally, so this is defense-in-depth (a quicker, cleaner rejection),
      // not the only enforcement point.
      try {
        await assertProviderUrlAllowed(config.baseUrl);
      } catch (error) {
        return response.ok({
          body: { success: false, latencyMs: 0, message: describeError(error) },
        });
      }
      const adapter = getProviderAdapter(config.type);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const startedAt = Date.now();
      let success = false;
      let message = '';
      try {
        for await (const event of adapter.chatStream(
          config,
          [{ role: 'user', content: 'Say "ok".' }],
          controller.signal,
        )) {
          if (event.type === 'delta') {
            success = true;
          } else if (event.type === 'error') {
            message = event.message;
          } else if (event.type === 'done') {
            break;
          }
        }
      } catch (error) {
        message = describeError(error);
      } finally {
        clearTimeout(timeout);
      }
      const latencyMs = Date.now() - startedAt;
      if (!success && !message) {
        message = 'Provider returned no content.';
      }
      logger.debug(
        `wazuhAiAssistant: provider test for ${config.id} -> success=${success}`,
      );
      return response.ok({
        body: { success, latencyMs, message: success ? undefined : message },
      });
    },
  );

  // Plugin-wide settings singleton: privacy defaults/override/field policy. GET creates the
  // object with defaults on first access (getOrCreateAssistantSettings above) so the admin UI and
  // server/routes/chat.ts's resolution logic never have to special-case "not configured yet".
  router.get(
    { path: API_PATHS.SETTINGS, validate: false },
    async (context, _request, response) => {
      const settings = await getOrCreateAssistantSettings(context);
      return response.ok({ body: settings });
    },
  );

  // Pre-flight administrator probe: lets the Settings page warn the user
  // and disable Save buttons BEFORE they attempt (and get rejected by) the real PUT below. Never
  // 403s — always 200 with the same {administrator, message} shape `checkAdministrator` produces,
  // using the SAME check/message mapping as the PUT gate so the two surfaces never disagree.
  //
  // `defaultApiHostId` (client-side session auto-heal): the Manager host id the client
  // should pass to the main Wazuh plugin's POST {basePath}/api/login to (re)establish a wz-token
  // cookie when `administrator` came back false for token reasons. Resolved via the SAME
  // `resolveApiHostId` every Manager-path tool call already uses (server/tools/api-host.ts), so this
  // never disagrees with which host the rest of the plugin would actually call. Wrapped in its own
  // try/catch -> null: an unresolvable host (no Wazuh manager host configured at all) must not turn
  // this always-200 probe into a 500, and `null` is a perfectly meaningful answer for the client
  // (nothing to heal against).
  router.get(
    { path: API_PATHS.SETTINGS_ACCESS, validate: false },
    async (context, request, response) => {
      const result = await checkAdministrator(context, request);
      const { administrator } = result;
      const message = result.administrator ? null : result.message;
      let defaultApiHostId: string | null;
      try {
        defaultApiHostId = await resolveApiHostId(context, request);
      } catch {
        defaultApiHostId = null;
      }
      return response.ok({
        body: {
          administrator,
          message,
          defaultApiHostId,
          apiKeyEncryptionEnabled: getApiKeyCipher().enabled,
        },
      });
    },
  );

  const fieldPolicyActionSchema = schema.oneOf([
    schema.literal('allow'),
    schema.literal('anonymize'),
    schema.literal('never'),
  ]);

  router.put(
    {
      path: API_PATHS.SETTINGS,
      validate: {
        body: schema.object({
          privacyDefaultOn: schema.boolean(),
          privacyDefaultPerProvider: schema.recordOf(
            schema.string(),
            schema.boolean(),
          ),
          userCanOverride: schema.boolean(),
          fieldPolicy: schema.arrayOf(
            schema.object({
              field: schema.string({ minLength: 1 }),
              action: fieldPolicyActionSchema,
              // Optional explicit pseudonym kind for fields whose bare name can't be classified
              // (tool-scoped Manager fields like "get_agents/name" declare HOST here).
              kind: schema.maybe(
                schema.oneOf([
                  schema.literal('HOST'),
                  schema.literal('IP'),
                  schema.literal('USER'),
                  schema.literal('URL'),
                  schema.literal('VAL'),
                ]),
              ),
            }),
          ),
          // Mandatory in the PUT body (same "no schema.maybe" convention as every other field
          // here — the Settings UI always sends the full object; a document written BEFORE
          // this field existed is handled on the READ side instead, getOrCreateAssistantSettings's
          // default-fill above). `min: 0` — a negative retention window has no meaning.
          conversationRetentionDays: schema.number({ min: 0 }),
        }),
      },
    },
    async (context, request, response) => {
      // Administrator-only gate: without this, any authenticated dashboard user could
      // rewrite the plugin's privacy defaults and field policy (e.g. blanket-'allow' every field,
      // silently defeating pseudonymization for every other user). Same mechanism the reference
      // plugin uses for its own administrator-only routes (v4.14.6
      // main/controllers/decorators.ts's `routeDecoratorProtectedAdministrator`; see
      // server/wazuh-core.d.ts). Fails CLOSED: any throw here is treated as "not an administrator",
      // never as "proceed" — the GET route above stays open (clients need to read defaults; it
      // never returns an apiKey), only this mutating PUT is gated.
      const result = await checkAdministrator(context, request);
      if (!result.administrator) {
        return response.forbidden({
          body: {
            message: result.message,
          },
        });
      }

      // Ensures the document exists (first-ever PUT with no prior GET) before updating it.
      // The actual write goes through the CURRENT user (`updateSettings`), unlike the read above
      // (`getOrCreateAssistantSettings`) — see server/settings-store.ts's doc comment.
      await getOrCreateAssistantSettings(context);
      await updateSettings(context, request.body);
      return response.ok({ body: request.body });
    },
  );
}
