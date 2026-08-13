import { RequestHandlerContext } from '../../../../src/core/server';
import {
  CONVERSATION_SESSIONS_INDEX_ALIAS,
  CONVERSATION_SESSIONS_ISM_POLICY_ID,
} from '../../common/constants';
import {
  AssistantSettingsAttributes,
  AssistantSettingsProvider,
} from './types';
import { isNotFoundError, reader, writer } from './opensearch-user';
import {
  applyRetentionDays,
  extractRetentionDays,
  IsmPolicy,
} from './ism-policy';

const FIELDS = ['conversationRetentionDays'] as const;

type IsmField = (typeof FIELDS)[number];

interface GetIsmPolicyResponse {
  policy: IsmPolicy;
  _seq_no: number;
  _primary_term: number;
}

/** Backing indices of the sessions data stream, targeted as a wildcard pattern since ISM's
 * `change_policy` API takes an index pattern, not a data stream name, and this plugin never
 * enumerates the stream's actual backing index names anywhere else either. */
const AFFECTED_INDEX_PATTERN = `${CONVERSATION_SESSIONS_INDEX_ALIAS}*`;

/** Keep saved conversations forever unless an admin opts into a retention window. */
const DEFAULT_CONVERSATION_RETENTION_DAYS = 7;

function policyPath(): string {
  return `/_plugins/_ism/policies/${encodeURIComponent(
    CONVERSATION_SESSIONS_ISM_POLICY_ID,
  )}`;
}

/**
 * `conversationRetentionDays`, sourced from — and, on write, pushed back into — the ISM policy
 * that governs `CONVERSATION_SESSIONS_INDEX_ALIAS` (`ism-policy.ts` owns the actual field shape).
 * Unlike `IndexSettingsProvider`, this provider owns no document of its own: the ISM policy is the
 * single source of truth, provisioned and already governing indices before this plugin ever reads
 * it, so there is nothing here to bootstrap — see `createDefaults`.
 *
 * `CONVERSATION_SESSIONS_ISM_POLICY_ID` (common/constants.ts) is the id the indexer side
 * provisions this policy under — until it actually exists in a given deployment, every call here
 * 404s and is handled the same as "not provisioned yet" (see `getSettings`/`createDefaults`).
 */
export class IsmSettingsProvider
  implements AssistantSettingsProvider<IsmField>
{
  readonly fields = FIELDS;

  readonly defaults: Pick<AssistantSettingsAttributes, IsmField> = {
    conversationRetentionDays: DEFAULT_CONVERSATION_RETENTION_DAYS,
  };

  private async fetchPolicy(
    context: RequestHandlerContext,
  ): Promise<GetIsmPolicyResponse | undefined> {
    try {
      const response = await reader(context).transport.request({
        method: 'GET',
        path: policyPath(),
      });
      return response.body as GetIsmPolicyResponse;
    } catch (error) {
      if (isNotFoundError(error)) {
        return undefined;
      }
      throw error;
    }
  }

  async getSettings(
    context: RequestHandlerContext,
  ): Promise<Pick<AssistantSettingsAttributes, IsmField> | undefined> {
    const fetched = await this.fetchPolicy(context);
    if (!fetched) {
      return undefined;
    }
    return { conversationRetentionDays: extractRetentionDays(fetched.policy) };
  }

  /** There is no document for this provider to create: the policy is provisioned indexer-side,
   * not by this plugin (same reasoning as `WAZUH_INDEXER_AI_ASSISTANT_SETTINGS_PATH` itself — see
   * `common/constants.ts`). On a deployment where the policy hasn't been provisioned yet,
   * `getSettings` keeps returning `undefined` and this simply echoes `this.defaults` back on every
   * read, exactly like the un-refactored code's own fallback for a document field that predates
   * the field's existence. */
  createDefaults(
    _context: RequestHandlerContext,
  ): Promise<Pick<AssistantSettingsAttributes, IsmField>> {
    return Promise.resolve(this.defaults);
  }

  /** Updates the policy's delete-transition `min_index_age` (via `applyRetentionDays`) and, since
   * an ISM policy edit alone does not affect indices that are already being managed under the
   * policy's PREVIOUS version, follows up with `change_policy` so those backing indices actually
   * pick up the new retention window rather than continuing to run the one they started with. */
  async updateSettings(
    context: RequestHandlerContext,
    attributes: Pick<AssistantSettingsAttributes, IsmField>,
  ): Promise<Pick<AssistantSettingsAttributes, IsmField>> {
    const fetched = await this.fetchPolicy(context);
    if (!fetched) {
      throw new Error(
        `Cannot update conversation retention: ISM policy "${CONVERSATION_SESSIONS_ISM_POLICY_ID}" ` +
          'was not found.',
      );
    }
    const nextPolicy = applyRetentionDays(
      fetched.policy,
      attributes.conversationRetentionDays,
    );
    await writer(context).transport.request({
      method: 'PUT',
      path:
        `${policyPath()}?if_seq_no=${fetched._seq_no}` +
        `&if_primary_term=${fetched._primary_term}`,
      body: { policy: nextPolicy },
    });
    await writer(context).transport.request({
      method: 'POST',
      path: `/_plugins/_ism/change_policy/${encodeURIComponent(
        AFFECTED_INDEX_PATTERN,
      )}`,
      body: { policy_id: CONVERSATION_SESSIONS_ISM_POLICY_ID },
    });
    return { conversationRetentionDays: extractRetentionDays(nextPolicy) };
  }
}
