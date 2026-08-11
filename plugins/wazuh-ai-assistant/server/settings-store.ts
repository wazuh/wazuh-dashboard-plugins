import { RequestHandlerContext } from '../../../src/core/server';
import { ASSISTANT_SETTINGS_INDEX } from '../common/constants';
import { ProviderConfig } from '../common/types';
import {
  isNotFoundError,
  reader,
  totalOf,
  writer,
} from './settings/opensearch-user';

/**
 * Document-level access to `providers` documents in the `.wazuh-ai-assistant-settings` hidden
 * system index (provisioned indexer-side — wazuh-indexer-plugins#1422 — not by this plugin). The
 * same index also holds the `settings` singleton document, owned by
 * `server/settings/index-settings-provider.ts` (part of the `AssistantSettingsManager` split,
 * wazuh-dashboard-plugins#8841/#500) — not this file, which is scoped to AI provider (OpenAI/
 * Anthropic endpoint) configuration only. Unlike `wazuh-ai-assistant-sessions`
 * (server/conversation-store.ts), this is a PLAIN index, not a data stream: there is exactly one
 * backing index, so ordinary get/index/update/delete by id all work directly against it — no
 * search-then-resolve-the-backing-index step is needed here.
 *
 * READ/WRITE USER SPLIT: every READ here goes through `asInternalUser`, every WRITE through
 * `asCurrentUser` — see `server/settings/opensearch-user.ts`'s doc comment for why.
 */

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
