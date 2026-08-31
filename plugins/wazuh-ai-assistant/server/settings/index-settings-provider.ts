import { RequestHandlerContext } from '../../../../src/core/server';
import { WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH } from '../../common/constants';
import {
  AssistantSettingsAttributes,
  AssistantSettingsProvider,
} from './types';
import { isNotFoundError, reader, writer } from './opensearch-user';
import {
  FIELD_POLICY_DEFAULTS,
  FieldPolicyAction,
  FieldPolicyEntry,
  PseudonymKind,
} from '../tools/privacy';

const FIELDS = [
  'privacyDefaultOn',
  'privacyDefaultPerProvider',
  'userCanOverride',
  'fieldPolicy',
] as const;

type IndexField = (typeof FIELDS)[number];

/** The spec's `action` enum only lists `allow`/`anonymize` — this plugin's own `FieldPolicyAction`
 * additionally allows `'never'` (server/tools/privacy.ts), which the indexer side does not yet
 * document. Passed through as-is rather than narrowed here: this boundary's job is transport, not
 * silently dropping a business-logic value the spec simply hasn't caught up to. */
interface FieldPolicyEntryWire {
  field: string;
  action: FieldPolicyAction;
  kind?: PseudonymKind;
}

/** Wire shapes of the Wazuh indexer's `/_plugins/_setup/ai_assistant/settings` endpoint — see
 * `WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH`'s doc comment (common/constants.ts) for the spec
 * link. snake_case, matching the OpenAPI schemas `AiAssistantSettings`/
 * `AiAssistantFieldPolicyEntry` verbatim; mapped to/from this plugin's own camelCase
 * `AssistantSettingsAttributes` slice at the boundary (`toAttributes`/`toWireRequest` below) so the
 * rest of the plugin never has to know about this naming difference — the exact same boundary
 * pattern `server/settings/ai-providers-client.ts` uses for provider documents. */
interface SettingsWire {
  privacy_default_on: boolean;
  privacy_default_per_provider: Record<string, boolean>;
  user_can_override: boolean;
  field_policy: FieldPolicyEntryWire[];
}

function toAttributes(
  wire: SettingsWire,
): Pick<AssistantSettingsAttributes, IndexField> {
  // The settings documents could not exist on the index, so the aacessing
  // to the fields should be uing optional chainin operator
  return {
    privacyDefaultOn: wire.privacy_default_on,
    privacyDefaultPerProvider: wire.privacy_default_per_provider,
    userCanOverride: wire.user_can_override,
    fieldPolicy: wire.field_policy?.map(
      // The field could not exist
      (entry): FieldPolicyEntry => ({
        field: entry.field,
        action: entry.action,
        ...(entry.kind === undefined ? {} : { kind: entry.kind }),
      }),
    ),
  };
}

function toWireRequest(
  attributes: Pick<AssistantSettingsAttributes, IndexField>,
): SettingsWire {
  return {
    privacy_default_on: attributes.privacyDefaultOn,
    privacy_default_per_provider: attributes.privacyDefaultPerProvider,
    user_can_override: attributes.userCanOverride,
    field_policy: attributes.fieldPolicy.map(
      (entry): FieldPolicyEntryWire => ({
        field: entry.field,
        action: entry.action,
        ...(entry.kind === undefined ? {} : { kind: entry.kind }),
      }),
    ),
  };
}

/**
 * Privacy defaults/override/field policy, sourced from — and, on write, pushed back into — the
 * Wazuh indexer's `/_plugins/_setup/ai_assistant/settings` endpoint (see
 * `WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH`'s doc comment, common/constants.ts, for the OpenAPI
 * spec link). That endpoint's `PUT` is a documented UPSERT, so there is no "must not auto-create
 * the underlying index" concern for this plugin to guard against with its own existence check:
 * the indexer plugin owns provisioning behind this endpoint, and calling it to persist defaults
 * on first access is the intended usage, not a workaround.
 *
 * `conversationRetentionDays` deliberately never appears in the wire shape this provider reads or
 * writes — it moved to `IsmSettingsProvider`, which is the sole owner of that field and reaches an
 * entirely different (real OpenSearch ISM) endpoint.
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

  /** Reads through the current user (server/settings/opensearch-user.ts's doc comment) — the
   * indexer's own `plugin:wazuh/ai_assistant/settings/read` permission on the calling user's
   * backend role is what authorizes this. The spec documents only
   * `200`/`403` for this GET; `404` is handled defensively anyway (same stance
   * `IsmSettingsProvider.fetchPolicy` takes toward its own endpoint) in case an installation is
   * reached before the indexer plugin has finished provisioning. A `403` (missing
   * `plugin:wazuh/ai_assistant/settings/read`) is a real authorization failure, not a "nothing
   * configured yet" signal, and is left to propagate rather than being treated as `undefined`. */
  async getSettings(
    context: RequestHandlerContext,
  ): Promise<Pick<AssistantSettingsAttributes, IndexField> | undefined> {
    try {
      const response = await reader(context).transport.request({
        method: 'GET',
        path: WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH,
      });
      return toAttributes(response.body as SettingsWire);
    } catch (error) {
      if (isNotFoundError(error)) {
        return undefined;
      }
      if (typeof error?.meta?.body?.error === 'string') {
        throw new Error(error?.meta?.body?.error, { cause: error });
      }
      throw error;
    }
  }

  /** Bootstraps the singleton on first access, through the same current-user client as
   * `getSettings` (`reader(context)` — reader and writer are the same client now, see
   * server/settings/opensearch-user.ts's doc comment). This PUT therefore needs the calling user's
   * own backend role to additionally hold `plugin:wazuh/ai_assistant/settings/write`, not just
   * `.../read`, the very first time this singleton is read on a fresh deployment — a read-only
   * caller hitting an unprovisioned deployment first will 403 here instead of bootstrapping it;
   * an admin should create the singleton once (e.g. via a Settings save) before relying on
   * read-only roles. `PUT` being a documented upsert (this file's class doc comment) is what makes
   * calling it here safe: unlike the old raw `index()` call it replaced, there is no risk of
   * silently auto-creating a hidden index with the wrong mapping as a side effect. */
  async createDefaults(
    context: RequestHandlerContext,
  ): Promise<Pick<AssistantSettingsAttributes, IndexField>> {
    await reader(context).transport.request({
      method: 'PUT',
      path: WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH,
      body: toWireRequest(this.defaults),
    });
    return this.defaults;
  }

  /** Runs as the current user (like every call here — see server/settings/opensearch-user.ts's
   * doc comment): the indexer's own `plugin:wazuh/ai_assistant/settings/write` permission check on
   * that identity is what authorizes this mutation. The endpoint's success response is just
   * `{message, status}` — it never echoes the persisted document back — so this returns
   * `attributes` itself rather than re-parsing a response body that doesn't carry it. */
  async updateSettings(
    context: RequestHandlerContext,
    attributes: Pick<AssistantSettingsAttributes, IndexField>,
  ): Promise<Pick<AssistantSettingsAttributes, IndexField>> {
    await writer(context).transport.request({
      method: 'PUT',
      path: WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH,
      body: toWireRequest(attributes),
    });
    return attributes;
  }
}
