import { RequestHandlerContext } from '../../../src/core/server';
import {
  ASSISTANT_SETTINGS_ID,
  ASSISTANT_SETTINGS_INDEX,
} from '../common/constants';
import { ProviderConfig } from '../common/types';
import { FieldPolicyEntry } from './tools/privacy';

/**
 * Document-level access to the `.wazuh-ai-assistant-settings` hidden system index (provisioned
 * indexer-side — wazuh-indexer-plugins#1422 — not by this plugin). Unlike
 * `wazuh-ai-assistant-sessions` (server/conversation-store.ts), this is a PLAIN index, not a data
 * stream: there is exactly one backing index, so ordinary get/index/update/delete by id all work
 * directly against it — no search-then-resolve-the-backing-index step is needed here.
 *
 * The index holds two kinds of documents under one strict mapping (wazuh-dashboard-plugins#8841):
 * one `settings` singleton (fixed id, `ASSISTANT_SETTINGS_ID`) and any number of `providers`
 * documents (one per configured AI provider, random UUID id — same id-generation convention the
 * removed saved-object type used).
 *
 * READ/WRITE USER SPLIT (wazuh-dashboard-plugins#8841's explicit split): every READ here goes
 * through `asInternalUser` — `.wazuh-ai-assistant-settings` is DLS-restricted to admin/wazuh-admin
 * backend roles indexer-side, but privacy defaults and the resolved default provider must be
 * readable by EVERY authenticated dashboard user for a normal chat turn to work (server/routes/
 * chat.ts), not just admins — so reads cannot depend on the calling user's own OpenSearch identity
 * carrying an admin backend role. Every WRITE (create/update/delete) goes through `asCurrentUser`
 * instead: the dashboard's own `requireAdministrator` gate (server/routes/settings.ts) is what
 * actually authorizes a mutation, and running the write as the current user keeps that write
 * attributable to a real identity rather than the internal/system one.
 */

type OpenSearchClient = RequestHandlerContext['core']['opensearch']['client'];

function reader(
  context: RequestHandlerContext,
): OpenSearchClient['asInternalUser'] {
  return context.core.opensearch.client.asInternalUser;
}

function writer(
  context: RequestHandlerContext,
): OpenSearchClient['asCurrentUser'] {
  return context.core.opensearch.client.asCurrentUser;
}

function isNotFoundError(error: unknown): boolean {
  const candidate = error as { statusCode?: number } | null | undefined;
  return candidate?.statusCode === 404;
}

function totalOf(total: { value: number } | number | undefined): number {
  if (total === undefined) {
    return 0;
  }
  return typeof total === 'number' ? total : total.value;
}

/** Attributes as the rest of the plugin already works with them (camelCase) — unchanged from the
 * removed saved-object type's shape, so `server/routes/settings.ts` and `server/routes/chat.ts`
 * needed no changes to their own provider-handling logic beyond how this shape is fetched. */
export interface StoredProviderAttributes {
  name: string;
  type: ProviderConfig['type'];
  baseUrl: string;
  model: string;
  apiKey?: string;
  isDefault?: boolean;
}

export interface StoredProvider {
  id: string;
  attributes: StoredProviderAttributes;
}

/** Wire shape under `.wazuh-ai-assistant-settings` — snake_case, matching the indexer's own
 * example verbatim (wazuh-indexer-plugins#1422). Mapped to/from `StoredProviderAttributes` at the
 * boundary (`toAttributes`/`toDocument` below) so the rest of the plugin never has to know about
 * this naming difference. */
interface ProviderDocument {
  providers: {
    name: string;
    type: ProviderConfig['type'];
    base_url: string;
    model: string;
    api_key?: string;
    is_default?: boolean;
  };
}

function toAttributes(document: ProviderDocument): StoredProviderAttributes {
  const { providers: provider } = document;
  return {
    name: provider.name,
    type: provider.type,
    baseUrl: provider.base_url,
    model: provider.model,
    apiKey: provider.api_key,
    isDefault: provider.is_default,
  };
}

function toDocument(attributes: StoredProviderAttributes): ProviderDocument {
  return {
    providers: {
      name: attributes.name,
      type: attributes.type,
      base_url: attributes.baseUrl,
      model: attributes.model,
      api_key: attributes.apiKey,
      is_default: attributes.isDefault,
    },
  };
}

/** Every provider document has a top-level `providers` key (the settings singleton has `settings`
 * instead), so this is enough to select "every provider, and nothing else" out of the shared
 * index. */
const PROVIDER_QUERY = { query: { exists: { field: 'providers' } } };

export async function listProviders(
  context: RequestHandlerContext,
  page: number,
  perPage: number,
): Promise<{ providers: StoredProvider[]; total: number }> {
  const response = await reader(context).search({
    index: ASSISTANT_SETTINGS_INDEX,
    body: {
      ...PROVIDER_QUERY,
      from: (page - 1) * perPage,
      size: perPage,
      track_total_hits: true,
    },
  });
  const body = response.body as {
    hits: {
      total: { value: number } | number;
      hits: Array<{ _id: string; _source: ProviderDocument }>;
    };
  };
  return {
    providers: body.hits.hits.map(hit => ({
      id: hit._id,
      attributes: toAttributes(hit._source),
    })),
    total: totalOf(body.hits.total),
  };
}

/** `size: 0` — only the count is needed (POST /providers's "is this the first provider" check). */
export async function countProviders(
  context: RequestHandlerContext,
): Promise<number> {
  const response = await reader(context).search({
    index: ASSISTANT_SETTINGS_INDEX,
    body: { ...PROVIDER_QUERY, size: 0, track_total_hits: true },
  });
  const body = response.body as {
    hits: { total: { value: number } | number };
  };
  return totalOf(body.hits.total);
}

export async function getProvider(
  context: RequestHandlerContext,
  id: string,
): Promise<StoredProvider | undefined> {
  try {
    const response = await reader(context).get({
      index: ASSISTANT_SETTINGS_INDEX,
      id,
    });
    const body = response.body as { _source: ProviderDocument };
    return { id, attributes: toAttributes(body._source) };
  } catch (error) {
    if (isNotFoundError(error)) {
      return undefined;
    }
    throw error;
  }
}

/** `op_type: 'create'` so a (practically impossible) id collision fails loudly instead of
 * silently overwriting an existing provider — same intent as the removed saved-object type's
 * `client.create(type, attrs, {id})`, which also refused to overwrite. */
export async function createProvider(
  context: RequestHandlerContext,
  id: string,
  attributes: StoredProviderAttributes,
): Promise<void> {
  await writer(context).index({
    index: ASSISTANT_SETTINGS_INDEX,
    id,
    op_type: 'create',
    body: toDocument(attributes),
  });
}

/** Full replace of a provider's fields. OpenSearch's partial-update `doc` merges nested objects
 * key-by-key rather than replacing `providers` wholesale, but since every key of `providers` is
 * always supplied here, the net effect is a full replace regardless. */
export async function updateProvider(
  context: RequestHandlerContext,
  id: string,
  attributes: StoredProviderAttributes,
): Promise<void> {
  await writer(context).update({
    index: ASSISTANT_SETTINGS_INDEX,
    id,
    body: { doc: toDocument(attributes) },
  });
}

/** Touches ONLY `providers.is_default` — relies on the same nested-merge behavior noted on
 * `updateProvider` above, so `clearOtherDefaults` (server/routes/settings.ts) can flip this one
 * field on many other providers without re-sending (or even having fetched) their other fields. */
export async function setProviderDefault(
  context: RequestHandlerContext,
  id: string,
  isDefault: boolean,
): Promise<void> {
  await writer(context).update({
    index: ASSISTANT_SETTINGS_INDEX,
    id,
    body: { doc: { providers: { is_default: isDefault } } },
  });
}

export async function deleteProvider(
  context: RequestHandlerContext,
  id: string,
): Promise<void> {
  await writer(context).delete({ index: ASSISTANT_SETTINGS_INDEX, id });
}

/** Attributes of the `.wazuh-ai-assistant-settings` singleton `settings` document. Scoped to the
 * privacy feature plus conversation retention — identical shape to the removed saved-object
 * type's `AssistantSettingsAttributes`, so nothing downstream of `getSettings`/`updateSettings`
 * needed to change. */
export interface AssistantSettingsAttributes {
  privacyDefaultOn: boolean;
  privacyDefaultPerProvider: Record<string, boolean>;
  userCanOverride: boolean;
  fieldPolicy: FieldPolicyEntry[];
  conversationRetentionDays: number;
}

interface AssistantSettingsDocument {
  settings: AssistantSettingsAttributes;
}

export async function getSettings(
  context: RequestHandlerContext,
): Promise<AssistantSettingsAttributes | undefined> {
  try {
    const response = await reader(context).get({
      index: ASSISTANT_SETTINGS_INDEX,
      id: ASSISTANT_SETTINGS_ID,
    });
    const body = response.body as { _source: AssistantSettingsDocument };
    return body._source.settings;
  } catch (error) {
    if (isNotFoundError(error)) {
      return undefined;
    }
    throw error;
  }
}

/** Bootstraps the singleton on first access. Uses the INTERNAL user, not the current one:
 * populating a deployment-wide default is infrastructure bootstrap, not a user-attributable
 * mutation, and must succeed regardless of whether the FIRST caller to ever hit GET /settings
 * happens to hold a backend role capable of writing this hidden index. Deliberately not wrapped
 * with its own conflict handling: two concurrent first-ever callers racing this is exactly as
 * unhandled as it was on the removed saved-object type (whichever `create` call loses would have
 * failed there too — see `getOrCreateAssistantSettings`, server/routes/settings.ts). */
export async function createSettings(
  context: RequestHandlerContext,
  defaults: AssistantSettingsAttributes,
): Promise<AssistantSettingsAttributes> {
  await reader(context).index({
    index: ASSISTANT_SETTINGS_INDEX,
    id: ASSISTANT_SETTINGS_ID,
    op_type: 'create',
    body: { settings: defaults },
  });
  return defaults;
}

/** The one deliberate WRITE that still goes through the current user (PUT /settings, admin-gated
 * — server/routes/settings.ts) rather than the internal one — see this module's doc comment. */
export async function updateSettings(
  context: RequestHandlerContext,
  attributes: AssistantSettingsAttributes,
): Promise<void> {
  await writer(context).update({
    index: ASSISTANT_SETTINGS_INDEX,
    id: ASSISTANT_SETTINGS_ID,
    body: { doc: { settings: attributes } },
  });
}
