/**
 * Pure read/mutate helpers for the shape of an OpenSearch ISM policy document, scoped to exactly
 * what `IsmSettingsProvider` needs: the `min_index_age` condition on whichever transition moves an
 * index into the policy's `delete` state. No OpenSearch client here — `ism-settings-provider.ts`
 * owns fetching/persisting the document; this module only knows how to read and edit it.
 *
 * Kept deliberately narrow: real ISM policies support many action/condition kinds, but retention
 * for `CONVERSATION_SESSIONS_INDEX_ALIAS` is expressed purely as "how many days before a backing
 * index transitions to `delete`" (common/constants.ts), so that is the only thing modeled here.
 */

export interface IsmTransition {
  state_name: string;
  conditions?: { min_index_age?: string; [key: string]: unknown };
}

export interface IsmState {
  name: string;
  transitions?: IsmTransition[];
  [key: string]: unknown;
}

export interface IsmPolicy {
  states: IsmState[];
  [key: string]: unknown;
}

const MIN_INDEX_AGE_DAYS = /^(\d+)d$/;

function findDeleteTransition(
  policy: IsmPolicy,
): { state: IsmState; transition: IsmTransition } | undefined {
  for (const state of policy.states ?? []) {
    const transition = (state.transitions ?? []).find(
      candidate => candidate.state_name.toLowerCase() === 'delete',
    );
    if (transition) {
      return { state, transition };
    }
  }
  return undefined;
}

/** Days a backing index lives before transitioning to `delete`, or `0` ("keep forever") when no
 * transition targets `delete` at all, or its `min_index_age` isn't expressed in whole days (this
 * plugin's own writes — `applyRetentionDays` below — always use whole days; anything else was set
 * by something else and is intentionally not interpreted here). */
export function extractRetentionDays(policy: IsmPolicy): number {
  const found = findDeleteTransition(policy);
  const minIndexAge = found?.transition.conditions?.min_index_age;
  const match =
    minIndexAge === undefined ? null : MIN_INDEX_AGE_DAYS.exec(minIndexAge);
  return match ? Number(match[1]) : 0;
}

/** The state a fresh transition into `delete` should be attached to when growing retention back up
 * from "forever" (see `applyRetentionDays`) — only knowable unambiguously when the policy has
 * exactly one non-`delete` state, matching every policy this plugin actually provisions/reads
 * (a single working state feeding into `delete`). */
function findSoleAttachmentState(policy: IsmPolicy): IsmState | undefined {
  const nonDeleteStates = (policy.states ?? []).filter(
    state => state.name.toLowerCase() !== 'delete',
  );
  return nonDeleteStates.length === 1 ? nonDeleteStates[0] : undefined;
}

/**
 * Returns a new policy (the input is never mutated) with the delete-transition's `min_index_age`
 * set to `${days}d`, or, when `days` is `0`, the delete-transition condition removed entirely so
 * an index never ages into `delete` at all — an empty `conditions: {}` would instead transition
 * unconditionally the very next time ISM evaluates it, which is the opposite of "keep forever".
 *
 * Growing "forever" back into a concrete window (`days > 0` with no existing transition into
 * `delete`) reattaches a fresh transition to the policy's sole non-`delete` state. Throws only when
 * that's ambiguous — multiple non-`delete` states, none of which we can pick over the others.
 */
export function applyRetentionDays(policy: IsmPolicy, days: number): IsmPolicy {
  const next = JSON.parse(JSON.stringify(policy)) as IsmPolicy;
  const found = findDeleteTransition(next);

  if (days <= 0) {
    if (!found) {
      return next;
    }
    const { conditions } = found.transition;
    const otherConditionKeys = Object.keys(conditions ?? {}).filter(
      key => key !== 'min_index_age',
    );
    if (otherConditionKeys.length > 0) {
      delete found.transition.conditions?.min_index_age;
    } else {
      found.state.transitions = (found.state.transitions ?? []).filter(
        transition => transition !== found.transition,
      );
    }
    return next;
  }

  if (found) {
    found.transition.conditions = {
      ...found.transition.conditions,
      min_index_age: `${days}d`,
    };
    return next;
  }

  const attachmentState = findSoleAttachmentState(next);
  if (!attachmentState) {
    throw new Error(
      'Cannot set conversation retention: the ISM policy has no transition into a "delete" ' +
        'state to attach a min_index_age condition to.',
    );
  }
  attachmentState.transitions = [
    ...(attachmentState.transitions ?? []),
    { state_name: 'delete', conditions: { min_index_age: `${days}d` } },
  ];
  return next;
}
