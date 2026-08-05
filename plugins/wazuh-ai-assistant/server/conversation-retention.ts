import {
  ASSISTANT_SETTINGS_ID,
  ASSISTANT_SETTINGS_SAVED_OBJECT_TYPE,
  CONVERSATION_SAVED_OBJECT_TYPE,
} from '../common/constants';
import { describeError } from '../common/errors';
import { AssistantSettingsAttributes } from './saved_objects/assistant-settings';
import { ConversationAttributes } from './saved_objects/conversation';
import { DEFAULT_CONVERSATION_RETENTION_DAYS } from './routes/settings';

/** Hourly: retention granularity is whole days, so this is already generous. */
export const CONVERSATION_RETENTION_INTERVAL_MS = 60 * 60 * 1000;

/** Rows deleted per find/delete round; bounds each round's memory and request fan-out. */
const PRUNE_BATCH_SIZE = 100;

const DAY_MS = 24 * 60 * 60 * 1000;

/** ECMAScript min Date. Clamping keeps an absurd stored retentionDays (schema allows any int32)
 * from producing a cutoff that `toISOString()` cannot serialize; nothing predates it. */
const MIN_DATE_MS = -8.64e15;

/** Single source of the cutoff arithmetic for the job (below) and the list route's
 * read-only visibility filter, so the two can't drift. */
export function retentionCutoffMs(
  retentionDays: number,
  nowMs: number,
): number {
  return Math.max(nowMs - retentionDays * DAY_MS, MIN_DATE_MS);
}

/** Duck-typed 404 check, same rationale (and shape) as conversations.ts's
 * `isVersionConflictError`: no OSD value imports. */
function isNotFoundError(error: unknown): boolean {
  const candidate = error as
    | { output?: { statusCode?: number }; statusCode?: number }
    | null
    | undefined;
  return candidate?.output?.statusCode === 404 || candidate?.statusCode === 404;
}

/** Structural slice of `ISavedObjectsRepository` — lets tests fake it without OSD value imports
 * (same constraint as conversations.ts's `isVersionConflictError` doc comment). */
export interface RetentionRepository {
  get<T = unknown>(type: string, id: string): Promise<{ attributes: T }>;
  find<T = unknown>(options: {
    type: string;
    page?: number;
    perPage?: number;
    filter?: string;
    fields?: string[];
  }): Promise<{ saved_objects: Array<{ id: string; attributes: T }> }>;
  delete(type: string, id: string): Promise<unknown>;
}

/** Structural slice of the platform `Logger`, for the same test-fake reason. */
export interface RetentionLogger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

export interface PruneResult {
  deleted: number;
  failed: number;
}

/**
 * One prune pass: reads the retention setting and deletes every conversation (any owner) whose
 * `updatedAt` is past the window. A failed delete is logged and retried on a later pass.
 */
export async function pruneExpiredConversations(
  repository: RetentionRepository,
  logger: RetentionLogger,
  nowMs = Date.now(),
): Promise<PruneResult> {
  let retentionDays = DEFAULT_CONVERSATION_RETENTION_DAYS;
  try {
    const settings = await repository.get<AssistantSettingsAttributes>(
      ASSISTANT_SETTINGS_SAVED_OBJECT_TYPE,
      ASSISTANT_SETTINGS_ID,
    );
    retentionDays =
      settings.attributes.conversationRetentionDays ??
      DEFAULT_CONVERSATION_RETENTION_DAYS;
  } catch (error) {
    if (!isNotFoundError(error)) {
      logger.warn(
        `wazuhAiAssistant: could not read assistant settings, assuming keep-forever retention: ${describeError(
          error,
        )}`,
      );
    }
  }
  if (retentionDays <= 0) {
    return { deleted: 0, failed: 0 };
  }

  const cutoffIso = new Date(
    retentionCutoffMs(retentionDays, nowMs),
  ).toISOString();
  // KQL range over the date-mapped `updatedAt` (server/saved_objects/conversation.ts), so the
  // repository matches expired rows server-side across ALL owners.
  const filter = `${CONVERSATION_SAVED_OBJECT_TYPE}.attributes.updatedAt < "${cutoffIso}"`;

  const totals: PruneResult = { deleted: 0, failed: 0 };
  for (;;) {
    // eslint-disable-next-line no-await-in-loop -- each batch's deletes must land before re-querying
    const batch = await repository.find<
      Pick<ConversationAttributes, 'updatedAt'>
    >({
      type: CONVERSATION_SAVED_OBJECT_TYPE,
      page: 1,
      perPage: PRUNE_BATCH_SIZE,
      filter,
      fields: ['updatedAt'],
    });
    if (batch.saved_objects.length === 0) {
      break;
    }
    // eslint-disable-next-line no-await-in-loop -- deletes within a batch run in parallel; batches are serial
    const outcomes = await Promise.all(
      batch.saved_objects.map(object =>
        repository.delete(CONVERSATION_SAVED_OBJECT_TYPE, object.id).then(
          () => true,
          (error: unknown) => {
            // Already gone (another pass/node, or the owner deleted it mid-pass) — that IS the
            // outcome retention wants, so it counts as deleted, not failed.
            if (isNotFoundError(error)) {
              return true;
            }
            logger.warn(
              `wazuhAiAssistant: could not delete expired conversation ${
                object.id
              }: ${describeError(error)}`,
            );
            return false;
          },
        ),
      ),
    );
    const deletedNow = outcomes.filter(Boolean).length;
    totals.deleted += deletedNow;
    totals.failed += outcomes.length - deletedNow;
    // Deletes shrink the result set, so page 1 is always re-queried. Zero progress means every
    // remaining match is undeletable right now — stop and let a later pass retry.
    if (deletedNow === 0) {
      break;
    }
  }

  if (totals.deleted > 0 || totals.failed > 0) {
    logger.info(
      `wazuhAiAssistant: retention pruned ${totals.deleted} expired conversation(s)` +
        (totals.failed > 0 ? ` (${totals.failed} delete(s) failed)` : ''),
    );
  }
  return totals;
}

/**
 * Runs a pass at startup and then every `CONVERSATION_RETENTION_INTERVAL_MS`; returns a stop
 * function for plugin stop(). Passes never overlap: a tick that fires while the previous pass is
 * still running is skipped.
 */
export function startConversationRetentionJob(
  repository: RetentionRepository,
  logger: RetentionLogger,
): () => void {
  let running = false;
  const run = async (): Promise<void> => {
    if (running) {
      return;
    }
    running = true;
    try {
      await pruneExpiredConversations(repository, logger);
    } catch (error) {
      logger.error(
        `wazuhAiAssistant: conversation retention pass failed: ${describeError(
          error,
        )}`,
      );
    } finally {
      running = false;
    }
  };
  void run();
  const timer = setInterval(run, CONVERSATION_RETENTION_INTERVAL_MS);
  return () => clearInterval(timer);
}
