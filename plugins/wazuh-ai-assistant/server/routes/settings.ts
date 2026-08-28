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
import { StoredProviderAttributes } from '../settings/ai-providers-client';
import { getApiKeyCipher } from '../plugin-services';
import { isEncrypted } from '../crypto/api-key-cipher';
import { resolveApiHostId } from '../tools/api-host';
import {
  isPermissionDeniedError,
  redactSensitiveDetail,
  paginationQuerySchema,
  resolvePagination,
  withInternalErrorHandling,
} from './route-helpers';

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
 * `perPage` used for `list` below), so a plain list+update loop is fine here; no bulk update API
 * is used because `AiProvidersClient`'s endpoint has no partial "update where" primitive of its
 * own — each write below re-sends the FULL attributes of the provider it's clearing, not just the
 * `isDefault` flag (see that class's doc comment). Both the list read and each clearing write run
 * as the calling user — see server/settings/opensearch-user.ts's doc comment.
 */
async function clearOtherDefaults(
  context: RequestHandlerContext,
  keepId: string,
): Promise<void> {
  const { aiProviders } = context.wazuh_ai_assistant;
  const { providers } = await aiProviders.list(context, 1, 200);
  await Promise.all(
    providers
      .filter(
        provider => provider.id !== keepId && provider.attributes.isDefault,
      )
      .map(provider =>
        aiProviders.update(context, provider.id, {
          ...provider.attributes,
          isDefault: false,
        }),
      ),
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
 * Distinguishes a missing/expired `wz-token` from every other `administrator_requirements` reason
 * (server/wazuh-core.d.ts's `isAdministratorUser`). Matches the three exact literals
 * `isAdministratorUser` returns for "no token" cases, plus the two observed shapes of its own live
 * Manager probe surfacing as a bare 401 (opening this app directly, without ever visiting the main
 * Wazuh app in this browser session, leaves no `wz-token` cookie at all): a bare "status code 401",
 * or "could not check" paired with "401" anywhere in the string (case-sensitive, matching the
 * reference plugin's own casing).
 */
function isTokenMissingOrExpiredReason(
  administratorRequirements: string,
): boolean {
  return (
    administratorRequirements === 'No token provider' ||
    administratorRequirements === 'Token is not valid' ||
    administratorRequirements === 'No API id provided' ||
    administratorRequirements.includes('status code 401') ||
    (administratorRequirements.includes('could not check') &&
      administratorRequirements.includes('401'))
  );
}

/** Actionable copy for a missing/expired Manager session, built from `MANAGER_SESSION_EXPIRED_COPY`
 * so the client-side heal/retry trigger (public/services/session-heal.ts) keeps matching it. The
 * raw `administratorRequirements` string is always included in parentheses so a report from a user
 * still carries the exact reference-plugin reason. */
function managerSessionExpiredMessage(
  administratorRequirements: string,
): string {
  return (
    `Your Wazuh Manager API ${MANAGER_SESSION_EXPIRED_COPY}. Open any page of the main Wazuh ` +
    'app (or reload and log in again) to establish it, then retry. ' +
    `(${administratorRequirements})`
  );
}

/**
 * Resolves whether the caller's Wazuh Manager session (`wz-token`) is alive — NOT whether they are
 * an administrator. AI Assistant settings and providers are no longer gated on the Manager's
 * administrator role: every read/write against them runs as the calling user against the Wazuh
 * indexer's own `/_plugins/_setup/ai_assistant/...` endpoints (server/settings/opensearch-user.ts's
 * `asCurrentUser`), so the indexer's own `plugin:wazuh/ai_assistant/settings/{read,write}`
 * permissions are the real authorization boundary now (see
 * docs/ref/modules/ai-assistant/security.md). `isAdministratorUser` remains the only
 * session-liveness probe `wazuh-core` exposes, so this reuses it but discards its role verdict:
 * "No administrator role"/"No permissions in token" mean the check itself SUCCEEDED — the session
 * is fine, this account simply isn't a Manager admin, which no longer matters here. Only a
 * token-missing/expired-shaped reason means the session itself has a problem.
 * Exported for unit testing only — every other caller in this file uses it directly.
 */
export async function checkManagerSession(
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const {
      administrator,
      administrator_requirements: administratorRequirements,
    } = await context.wazuh_core.dashboardSecurity.isAdministratorUser(
      context,
      request,
    );
    if (
      administrator !== true &&
      administratorRequirements &&
      isTokenMissingOrExpiredReason(administratorRequirements)
    ) {
      return {
        ok: false,
        message: managerSessionExpiredMessage(administratorRequirements),
      };
    }
    return { ok: true };
  } catch {
    // This is only a liveness probe; the indexer enforces the real permission check on the
    // actual read/write, so an unexpected failure here just means "can't tell", which fails OPEN
    // (no needless heal attempt) rather than closed.
    return { ok: true };
  }
}

/** Backstop for direct API calls — the UI blocks these writes first (see the access probe's
 * `apiKeyEncryptionEnabled`). Keep short; never reference repo files. */
export const ENCRYPTION_REQUIRED_MESSAGE =
  'API keys cannot be saved: encryption at rest is not configured, so the key would be stored ' +
  'in plain text. Generate a base64-encoded 32-byte key (e.g. `openssl rand -base64 32`) and ' +
  'store it as `wazuh_ai_assistant.encryptionKey` — either with `opensearch-dashboards-keystore ' +
  'add wazuh_ai_assistant.encryptionKey` (recommended) or in `opensearch_dashboards.yml` — then ' +
  'restart dashboard service and try again.';

/** First-page size for the provider-name scan below, matching `clearOtherDefaults`'s own `perPage`.
 * A store larger than this is re-read in full — see `rejectDuplicateProviderName`. */
const PROVIDER_SCAN_PAGE_SIZE = 200;

/** Message for a name already taken by another provider. Kept as a builder so the route and its
 * test agree on the exact wording the admin sees. */
export function duplicateProviderNameMessage(name: string): string {
  return `A provider named "${name}" already exists.`;
}

/**
 * Rejects a provider name that is already taken by ANOTHER provider with HTTP 409.
 *
 * Provider names are the only way an admin tells two providers apart in the chat's provider
 * selector and in every toast/error this plugin emits, so two providers sharing one name is
 * indistinguishable in the UI even though the ids differ. The comparison is `trim()` +
 * `toLowerCase()`: " OpenAI " and "openai" read as the same provider to a human, so accepting both
 * would defeat the point.
 *
 * `excludeId` is the provider being updated (PUT /providers/{id}) so re-saving a provider without
 * renaming it never collides with itself; it is `undefined` on create.
 *
 * The scan must cover EVERY provider, not just the first page: the client-side pre-check in the
 * add/edit flyout compares against the full list (public/services/settings-service.ts's `list()`
 * loops pages via `fetchAllPages`), so a server that only compared the first page would disagree
 * with it and let provider #201's name through. The first read therefore uses the same `perPage` as
 * `clearOtherDefaults` above and then re-lists with `perPage: total` if the store turned out to
 * hold more — cheap, because every read of this store materializes the whole thing in memory
 * anyway (server/settings/ai-providers-client.ts).
 *
 * Residual race (accepted): this is a read followed by a separate write, and the indexer endpoint
 * backing providers has no unique constraint on `name`, so two admins creating the same name at the
 * same instant can both pass this check. Closing that would need a constraint the storage layer
 * does not offer. The window is milliseconds, the outcome is cosmetic (two same-named providers,
 * fixable by renaming one), and the check still catches every realistic case: a stale flyout list,
 * a second browser tab, and a direct API caller.
 *
 * Exported for unit testing only — the routes below call it directly.
 */
export async function rejectDuplicateProviderName(
  context: RequestHandlerContext,
  name: string,
  excludeId: string | undefined,
  response: OpenSearchDashboardsResponseFactory,
): Promise<IOpenSearchDashboardsResponse | null> {
  const normalized = name.trim().toLowerCase();
  const { aiProviders } = context.wazuh_ai_assistant;
  const firstPage = await aiProviders.list(context, 1, PROVIDER_SCAN_PAGE_SIZE);
  let { providers } = firstPage;
  if (providers.length < firstPage.total) {
    ({ providers } = await aiProviders.list(context, 1, firstPage.total));
  }
  const taken = providers.some(
    provider =>
      provider.id !== excludeId &&
      (provider.attributes.name ?? '').trim().toLowerCase() === normalized,
  );
  if (!taken) {
    return null;
  }
  return response.customError({
    statusCode: 409,
    body: { message: duplicateProviderNameMessage(name.trim()) },
  });
}

/** Rejects a name that is empty once trimmed. The body schema's `minLength: 1` only rejects the
 * empty string, so `"   "` reaches here; since both the uniqueness comparison and the persisted
 * value are trimmed (L9), a whitespace-only name would otherwise be stored as `""`. */
export function rejectBlankProviderName(
  name: string,
  response: OpenSearchDashboardsResponseFactory,
): IOpenSearchDashboardsResponse | null {
  if (name.trim().length > 0) {
    return null;
  }
  return response.badRequest({
    body: { message: 'Provider name cannot be empty.' },
  });
}

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
      const { providers, total } =
        await context.wazuh_ai_assistant.aiProviders.list(
          context,
          page,
          perPage,
        );
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
    }, logger),
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
      const blankName = rejectBlankProviderName(request.body.name, response);
      if (blankName) {
        return blankName;
      }
      // Name uniqueness, before any document write: `crypto.randomUUID()` below would otherwise
      // happily mint a second provider indistinguishable from an existing one in every UI surface.
      const duplicateName = await rejectDuplicateProviderName(
        context,
        request.body.name,
        undefined,
        response,
      );
      if (duplicateName) {
        return duplicateName;
      }
      const isFirstProvider =
        (await context.wazuh_ai_assistant.aiProviders.count(context)) === 0;
      const isDefault = isFirstProvider || Boolean(request.body.isDefault);
      // THE CREATE-BEFORE-ID PROBLEM (AAD binding, server/crypto/api-key-cipher.ts): `enc:v1:`
      // binds the ciphertext to the id `PUT .../providers/{id}` is called with, but there is no
      // id to bind against until AFTER a create call that lets the server mint one (`POST
      // .../providers` per the OpenAPI spec). Rather than create-then-update (two writes, with a
      // real "provider left with no key" failure window if the second write fails), this
      // pre-generates the id client-side with `crypto.randomUUID()` and passes it through
      // `aiProviders.create(context, providerId, attrs)` (`PUT .../providers/{providerId}` — see
      // server/settings/ai-providers-client.ts), a proven-working call shape, not a new
      // assumption.
      // This keeps provider creation a SINGLE atomic write: either it fully succeeds (provider
      // exists, apiKey correctly bound to its own id from birth) or it fails outright and NOTHING
      // is created, surfaced to the caller as the same 500 `withInternalErrorHandling` every
      // other failure in this route already produces. There is no partial/half-written state to
      // reason about: no second write exists that could fail after the first one succeeded.
      // Encryption-at-rest (server/crypto/api-key-cipher.ts): the encryption gate above
      // guarantees the cipher is enabled whenever a non-empty apiKey reaches this point.
      // `request.body.apiKey` is `schema.maybe(schema.string())`; an absent/empty value
      // stays absent/empty (encrypt() is only ever called with a truthy string).
      const providerId = crypto.randomUUID();
      const attributes: StoredProviderAttributes = {
        ...request.body,
        // Persist the trimmed name so what is STORED matches what the uniqueness check above
        // compared: otherwise " OpenAI " could be saved and then collide with itself on the next
        // edit, and the two would render as visually identical rows.
        name: request.body.name.trim(),
        apiKey: request.body.apiKey
          ? getApiKeyCipher().encrypt(request.body.apiKey, providerId)
          : request.body.apiKey,
        isDefault,
      };
      await context.wazuh_ai_assistant.aiProviders.create(
        context,
        providerId,
        attributes,
      );
      if (isDefault) {
        await clearOtherDefaults(context, providerId);
      }
      return response.ok({ body: toSummary(providerId, attributes) });
    }, logger),
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
      // This is the most sensitive mutation on the route: omitting `apiKey` from the body keeps
      // the stored key, so a caller without the indexer's own write permission on this endpoint —
      // rejected by `aiProviders.update`'s `asCurrentUser` call below — could otherwise redirect
      // an existing credential to a host of their choosing just by changing `baseUrl`.
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
      const existing = await context.wazuh_ai_assistant.aiProviders.get(
        context,
        request.params.id,
      );
      if (!existing) {
        return response.notFound();
      }
      const blankName = rejectBlankProviderName(request.body.name, response);
      if (blankName) {
        return blankName;
      }
      // Same uniqueness rule as POST /providers, excluding this provider so re-saving it (or
      // renaming it to a different casing/spacing of its own name) never collides with itself.
      const duplicateName = await rejectDuplicateProviderName(
        context,
        request.body.name,
        request.params.id,
        response,
      );
      if (duplicateName) {
        return duplicateName;
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
      // `PUT .../providers/{id}` never echoes the persisted object back (just `{message, status,
      // id}` — see server/settings/ai-providers-client.ts), so build the summary from what we
      // know was just written instead of re-reading it back.
      const nextAttributes: StoredProviderAttributes = {
        ...existing.attributes,
        ...request.body,
        // Same trim-at-the-write rule as POST /providers above.
        name: request.body.name.trim(),
        apiKey: nextApiKey,
        isDefault: nextIsDefault,
      };
      await context.wazuh_ai_assistant.aiProviders.update(
        context,
        request.params.id,
        nextAttributes,
      );
      if (nextIsDefault) {
        await clearOtherDefaults(context, request.params.id);
      }
      return response.ok({
        body: toSummary(request.params.id, nextAttributes),
      });
    }, logger),
  );

  // Set a provider as the default, clearing the flag on every other provider.
  router.post(
    {
      path: API_PATHS.PROVIDER_SET_DEFAULT(`{id}`),
      validate: { params: schema.object({ id: schema.string() }) },
    },
    withInternalErrorHandling(async (context, request, response) => {
      const { aiProviders } = context.wazuh_ai_assistant;
      const existing = await aiProviders.get(context, request.params.id);
      if (!existing) {
        return response.notFound();
      }
      // No partial-update primitive on the new endpoint (see AiProvidersClient's doc comment):
      // resend the FULL existing attributes with only `isDefault` flipped, rather than the old
      // `setProviderDefault`'s single-field partial write.
      const nextAttributes: StoredProviderAttributes = {
        ...existing.attributes,
        isDefault: true,
      };
      await aiProviders.update(context, request.params.id, nextAttributes);
      await clearOtherDefaults(context, request.params.id);
      return response.ok({
        body: toSummary(request.params.id, nextAttributes),
      });
    }, logger),
  );

  // Delete a provider.
  router.delete(
    {
      path: API_PATHS.PROVIDER_BY_ID(`{id}`),
      validate: { params: schema.object({ id: schema.string() }) },
    },
    withInternalErrorHandling(async (context, request, response) => {
      await context.wazuh_ai_assistant.aiProviders.delete(
        context,
        request.params.id,
      );
      return response.ok({ body: { deleted: true } });
    }, logger),
  );

  // Minimal connectivity test: send a one-line "say ok" prompt through the real adapter and
  // measure round-trip latency, without exposing the API key back to the browser.
  router.post(
    {
      path: API_PATHS.PROVIDER_TEST(`{id}`),
      validate: { params: schema.object({ id: schema.string() }) },
    },
    // Wrapped like every other provider route: the `aiProviders.get` below reads the index as the
    // calling user, so an RBAC denial here must map to the same sanitized 403 instead of reaching
    // the platform uncaught and surfacing as a generic 500.
    withInternalErrorHandling(async (context, request, response) => {
      // This route returns the provider's own response to the caller, which makes it a
      // read-capable SSRF primitive on top of the url-guard's network restrictions — the
      // indexer's own write permission on this endpoint is what actually authorizes it.
      const stored = await context.wazuh_ai_assistant.aiProviders.get(
        context,
        request.params.id,
      );
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
    }, logger),
  );

  // Plugin-wide settings singleton: privacy defaults/override/field policy. GET creates the
  // object with defaults on first access (AssistantSettingsManager.getOrCreateSettings, reached
  // via context.wazuh_ai_assistant.assistantSettings — server/settings/route-handler-context.ts)
  // so the admin UI and server/routes/chat.ts's resolution logic never have to special-case "not
  // configured yet".
  router.get(
    { path: API_PATHS.SETTINGS, validate: false },
    withInternalErrorHandling(async (context, _request, response) => {
      const settings =
        await context.wazuh_ai_assistant.assistantSettings.getOrCreateSettings(
          context,
        );
      return response.ok({ body: settings });
    }, logger),
  );

  // Manager-session liveness probe, called on app mount and before Manager-path work
  // (public/services/session-heal.ts's `ensureManagerSession`) so a missing/expired `wz-token` can
  // be healed before it causes a confusing failure elsewhere (see `checkManagerSession` above).
  // Always 200.
  //
  // `defaultApiHostId` (client-side session auto-heal): the Manager host id the client should pass
  // to the main Wazuh plugin's POST {basePath}/api/login to (re)establish a wz-token cookie when
  // `managerSessionOk` came back false. Resolved via the SAME `resolveApiHostId` every Manager-path
  // tool call already uses (server/tools/api-host.ts), so this never disagrees with which host the
  // rest of the plugin would actually call. Wrapped in its own try/catch -> null: an unresolvable
  // host (no Wazuh manager host configured at all) must not turn this always-200 probe into a 500,
  // and `null` is a perfectly meaningful answer for the client (nothing to heal against).
  router.get(
    { path: API_PATHS.SETTINGS_ACCESS, validate: false },
    async (context, request, response) => {
      const sessionCheck = await checkManagerSession(context, request);
      let defaultApiHostId: string | null;
      try {
        defaultApiHostId = await resolveApiHostId(context, request);
      } catch {
        defaultApiHostId = null;
      }
      return response.ok({
        body: {
          managerSessionOk: sessionCheck.ok,
          message: sessionCheck.ok ? null : sessionCheck.message,
          defaultApiHostId,
          apiKeyEncryptionEnabled: getApiKeyCipher().enabled,
        },
      });
    },
  );

  const fieldPolicyActionSchema = schema.oneOf([
    schema.literal('allow'),
    // #8912: value passes, but is first run through the shape scan (IPs/FQDNs) AND a
    // known-entity dictionary scan (already-minted real values) — see privacy.ts's
    // `FieldPolicyAction` doc comment and `scrubKnownEntities`.
    schema.literal('allow-scan'),
    schema.literal('anonymize'),
    schema.literal('never'),
  ]);

  router.put(
    {
      path: API_PATHS.SETTINGS,
      validate: {
        body: schema.object({
          privacyDefaultOn: schema.boolean(),
          // Optional with a default (not `schema.maybe`, which would make the field
          // `undefined` and push the empty-object fallback onto every caller): a client that
          // has no per-provider overrides yet (or predates this field) must not have its whole
          // save 400 for omitting it. Matches the `{ defaultValue }` idiom used for every other
          // optional-with-default field in this file/plugin (route-helpers.ts's `page`/
          // `perPage`, config.ts's `enabled`).
          privacyDefaultPerProvider: schema.recordOf(
            schema.string(),
            schema.boolean(),
            { defaultValue: {} },
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
          // this field existed is handled on the READ side instead, by
          // AssistantSettingsManager.getOrCreateSettings's per-field default-fill above).
          // `min: 0` — a negative retention window has no meaning.
          conversationRetentionDays: schema.number({ min: 0 }),
        }),
      },
    },
    withInternalErrorHandling(async (context, request, response) => {
      // Ensures every provider's backend exists (first-ever PUT with no prior GET) before
      // updating it. The actual write goes through the CURRENT user for every provider, unlike
      // the read above (`getOrCreateSettings`) — see server/settings/opensearch-user.ts's doc
      // comment. Wrapped so a denial here is sanitized too, not just one from `updateSettings`.
      const { assistantSettings } = context.wazuh_ai_assistant;
      await assistantSettings.getOrCreateSettings(context);
      try {
        const updated = await assistantSettings.updateSettings(
          context,
          request.body,
        );
        return response.ok({ body: updated });
      } catch (error) {
        // Rethrow so the wrapper sanitizes it, instead of falling into the 503 below.
        if (isPermissionDeniedError(error)) {
          throw error;
        }
        // Surfaces `IsmSettingsProvider`'s "policy not found"/"no delete transition" failures
        // (expected on any deployment where `CONVERSATION_SESSIONS_ISM_POLICY_ID` — see
        // common/constants.ts — hasn't been provisioned indexer-side yet) as an actionable 503
        // instead of a bare 500.
        return response.customError({
          statusCode: 503,
          body: { message: redactSensitiveDetail(describeError(error)) },
        });
      }
    }, logger),
  );
}
