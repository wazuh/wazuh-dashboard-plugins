import { RequestHandlerContext } from '../../../../src/core/server';
import {
  ASSISTANT_SETTINGS_ID,
  ASSISTANT_SETTINGS_INDEX,
} from '../../common/constants';
import {
  AssistantSettingsAttributes,
  AssistantSettingsProvider,
} from './types';
import { isNotFoundError, reader, writer } from './opensearch-user';
import { FIELD_POLICY_DEFAULTS } from '../tools/privacy';

const FIELDS = [
  'privacyDefaultOn',
  'privacyDefaultPerProvider',
  'userCanOverride',
  'fieldPolicy',
] as const;

type IndexField = (typeof FIELDS)[number];

interface AssistantSettingsDocument {
  settings: Pick<AssistantSettingsAttributes, IndexField>;
}

/**
 * Privacy defaults/override/field policy, stored in the `.wazuh-ai-assistant-settings` singleton
 * document (fixed id `ASSISTANT_SETTINGS_ID`) — a PLAIN index, not a data stream, so ordinary
 * get/index/update by id all work directly against it, no search-then-resolve step needed. The
 * INDEX itself is provisioned indexer-side (wazuh-indexer-plugins#1422) — this provider only ever
 * reads/writes the document, never the index; see `createDefaults` below.
 *
 * `conversationRetentionDays` deliberately never appears in the document this provider reads or
 * writes any more — it moved to `IsmSettingsProvider`, which is the sole owner of that field. A
 * pre-#8841 document may still carry a leftover `conversationRetentionDays` key under `settings`;
 * this provider simply never reads it.
 */
export class IndexSettingsProvider
  implements AssistantSettingsProvider<IndexField>
{
  readonly fields = FIELDS;

  /** Keep privacy off, overridable, with the built-in field policy, and no per-provider override
   * until an admin sets one — the deployment's out-of-the-box behavior before anyone touches
   * Settings. */
  readonly defaults: Pick<AssistantSettingsAttributes, IndexField> = {
    privacyDefaultOn: false,
    privacyDefaultPerProvider: {},
    userCanOverride: true,
    fieldPolicy: FIELD_POLICY_DEFAULTS,
  };

  async getSettings(
    context: RequestHandlerContext,
  ): Promise<Pick<AssistantSettingsAttributes, IndexField> | undefined> {
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

  /** Bootstraps the singleton DOCUMENT on first access, through the INTERNAL user: populating a
   * deployment-wide default is infrastructure bootstrap, not a user-attributable mutation, and
   * must succeed regardless of whether the first-ever caller holds a backend role capable of
   * writing this hidden index. Deliberately not wrapped with its own conflict handling: two
   * concurrent first-ever callers racing this is exactly as unhandled as it was before this
   * provider existed — whichever `create` call loses would have failed there too.
   *
   * Never creates `ASSISTANT_SETTINGS_INDEX` itself — that index is provisioned indexer-side
   * (wazuh-indexer-plugins#1422), not by this plugin (see this file's class doc comment). A plain
   * `index()` call would silently auto-create a missing index (with no mapping of its own) as a
   * side effect, so existence is checked FIRST; if the index isn't there yet, this echoes `this.
   * defaults` back without writing anything — the same stance `IsmSettingsProvider.createDefaults`
   * takes toward a resource it doesn't own. */
  async createDefaults(
    context: RequestHandlerContext,
  ): Promise<Pick<AssistantSettingsAttributes, IndexField>> {
    const exists = await reader(context).indices.exists({
      index: ASSISTANT_SETTINGS_INDEX,
    });
    if (!exists.body) {
      return this.defaults;
    }
    await reader(context).index({
      index: ASSISTANT_SETTINGS_INDEX,
      id: ASSISTANT_SETTINGS_ID,
      op_type: 'create',
      body: { settings: this.defaults },
    });
    return this.defaults;
  }

  /** The one deliberate write that goes through the CURRENT user rather than the internal one —
   * the dashboard's own `requireAdministrator` gate (server/routes/settings.ts) is what actually
   * authorizes this mutation, and running it as the current user keeps it attributable to a real
   * identity. Partial `doc` update — merges into the existing `settings` object rather than
   * replacing it wholesale, so a leftover legacy `conversationRetentionDays` key is left alone. */
  async updateSettings(
    context: RequestHandlerContext,
    attributes: Pick<AssistantSettingsAttributes, IndexField>,
  ): Promise<Pick<AssistantSettingsAttributes, IndexField>> {
    await writer(context).update({
      index: ASSISTANT_SETTINGS_INDEX,
      id: ASSISTANT_SETTINGS_ID,
      body: { doc: { settings: attributes } },
    });
    return attributes;
  }
}
