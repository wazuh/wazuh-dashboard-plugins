import { RequestHandlerContext } from '../../../../src/core/server';
import { WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH } from '../../common/constants';
import { ProviderConfig } from '../../common/types';
import { isNotFoundError, reader, writer } from './opensearch-user';

/** Attributes as the rest of the plugin already works with them (camelCase) — unchanged from the
 * removed saved-object type's (and, before that, the direct-index code's) shape, so
 * server/routes/settings.ts and server/routes/chat.ts needed no changes to their own
 * provider-handling logic beyond how this shape is fetched. */
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

/** Wire shape of one entry in `GET {WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH}`'s `providers`
 * array (the OpenAPI spec's `AiAssistantProvider` schema) — snake_case, `_id` at the top level
 * rather than an OpenSearch document `_id`. Mapped to/from `StoredProvider`/
 * `StoredProviderAttributes` at the boundary (`toStoredProvider`/`toRequestWire` below) so the
 * rest of the plugin never has to know about this naming difference. */
interface ProviderWire {
  _id: string;
  name: string;
  type: ProviderConfig['type'];
  base_url: string;
  model: string;
  api_key?: string;
  is_default?: boolean;
}

/** Only the `providers` key is read here — the same response also carries `settings`/
 * `field_policy`, `server/settings/index-settings-provider.ts`'s own concern. */
interface GetSettingsResponseWire {
  providers: ProviderWire[];
}

/** Body of `PUT {WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH}/providers/{id}` (the spec's
 * `AiAssistantProviderRequest`) — no `_id` (the id is the URL path segment, not part of the body). */
interface ProviderRequestWire {
  name: string;
  type: ProviderConfig['type'];
  base_url: string;
  model: string;
  api_key?: string;
  is_default?: boolean;
}

function toStoredProvider(wire: ProviderWire): StoredProvider {
  return {
    id: wire._id,
    attributes: {
      name: wire.name,
      type: wire.type,
      baseUrl: wire.base_url,
      model: wire.model,
      apiKey: wire.api_key,
      isDefault: wire.is_default,
    },
  };
}

function toRequestWire(
  attributes: StoredProviderAttributes,
): ProviderRequestWire {
  return {
    name: attributes.name,
    type: attributes.type,
    base_url: attributes.baseUrl,
    model: attributes.model,
    api_key: attributes.apiKey,
    is_default: attributes.isDefault,
  };
}

function providerPath(id?: string): string {
  return [
    `${WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH}/providers`,
    ...(id ? [`${encodeURIComponent(id)}`] : []),
  ].join('/');
}

/**
 * AI provider (OpenAI/Anthropic endpoint) configuration, sourced from — and, on write, pushed
 * back into — the Wazuh indexer's `/_plugins/_setup/ai_assistant/settings/providers*` endpoints
 * (see `WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH`'s doc comment, common/constants.ts, for the
 * OpenAPI spec link). Replaces the direct `.wazuh-ai-assistant-settings` index access
 * `server/settings-store.ts` used before this endpoint existed (wazuh-dashboard-plugins#500).
 *
 * Two contract gaps versus the raw index access this replaces, both handled below rather than
 * papered over:
 *
 * - No standalone list/get-one/count endpoint: the only read is the bundled
 *   `GET {WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH}`, which returns `providers` alongside
 *   `settings`/`field_policy` in one response with no pagination or query capability of its own.
 *   `list`/`count`/`get` below all fetch that SAME full response (`fetchAll`) and slice/search it
 *   in memory — one full round trip per call, same as the raw-index code this replaces made one
 *   `.search()`/`.get()` call per read. Providers are capped at ~200 (see `list`'s `perPage` in
 *   server/routes/settings.ts), so the response size is bounded and this is not a scaling concern.
 * - No partial-update primitive: `PUT .../providers/{id}` is a full create-or-update, unlike the
 *   old `.update({doc: {...}})` this replaces. Every write below sends the COMPLETE provider body;
 *   server/routes/settings.ts's `clearOtherDefaults` (previously a partial `is_default`-only flip)
 *   now re-sends each affected provider's full attributes with `isDefault: false` via `update`.
 */
export class AiProvidersClient {
  private async fetch(
    { method, path, body }: { method: string; path: string; body?: unknown },
    executor: ReturnType<typeof reader>,
  ) {
    return executor.transport.request({
      method,
      path,
      body,
    });
  }

  /** Reads through the INTERNAL user — see server/settings/opensearch-user.ts's doc comment for
   * why: resolving the default provider for a chat turn must work for every authenticated
   * dashboard user, not just admins. A `404` (deployment reached before the indexer plugin has
   * finished provisioning) is treated as "no providers yet" rather than an error, matching
   * `IndexSettingsProvider.getSettings`'s stance toward the same endpoint. */
  private async fetchAll(
    context: RequestHandlerContext,
  ): Promise<StoredProvider[]> {
    try {
      const response = await this.fetch(
        { method: 'GET', path: WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH },
        reader(context),
      );
      const body = response.body as GetSettingsResponseWire;
      return body.providers.map(toStoredProvider);
    } catch (error) {
      if (isNotFoundError(error)) {
        return [];
      }
      throw error;
    }
  }

  async list(
    context: RequestHandlerContext,
    page: number,
    perPage: number,
  ): Promise<{ providers: StoredProvider[]; total: number }> {
    const all = await this.fetchAll(context);
    const from = (page - 1) * perPage;
    return { providers: all.slice(from, from + perPage), total: all.length };
  }

  /** Used only for POST /providers's "is this the first provider" check — no `size: 0`-style
   * shortcut is available here, `fetchAll` is the only read this endpoint offers. */
  async count(context: RequestHandlerContext): Promise<number> {
    return (await this.fetchAll(context)).length;
  }

  async get(
    context: RequestHandlerContext,
    id: string,
  ): Promise<StoredProvider | undefined> {
    return (await this.fetchAll(context)).find(provider => provider.id === id);
  }

  /** `op_type: 'create'`'s old fail-loud-on-id-collision guarantee has no equivalent here: `PUT
   * .../providers/{id}` is an unconditional upsert per the spec, so a (practically impossible)
   * `crypto.randomUUID()` collision would now silently overwrite instead of failing loudly. Kept
   * as its own method — rather than folding into `update` — purely to keep that intent documented
   * at each call site, even though the two send an identical request. */
  async create(
    context: RequestHandlerContext,
    id: string,
    attributes: StoredProviderAttributes,
  ): Promise<void> {
    await this.fetch(
      {
        method: 'PUT',
        path: providerPath(id),
        body: toRequestWire(attributes),
      },
      writer(context),
    );
  }

  /** The one deliberate write reached through the CURRENT user rather than the internal one — the
   * dashboard's own `requireAdministrator` gate (server/routes/settings.ts) is what actually
   * authorizes this mutation, and running it as the current user keeps it attributable to a real
   * identity (and gives the indexer's own `plugin:wazuh/ai_assistant/settings/write` permission
   * check a real identity to evaluate, as defense in depth). */
  async update(
    context: RequestHandlerContext,
    id: string,
    attributes: StoredProviderAttributes,
  ): Promise<void> {
    await this.fetch(
      {
        method: 'PUT',
        path: providerPath(id),
        body: toRequestWire(attributes),
      },
      writer(context),
    );
  }

  async delete(context: RequestHandlerContext, id: string): Promise<void> {
    await this.fetch(
      { method: 'DELETE', path: providerPath(id) },
      writer(context),
    );
  }
}
