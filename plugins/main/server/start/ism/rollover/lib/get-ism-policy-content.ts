export function generateISMPolicyWithContent(
  content,
  {
    rolloverMinPrimaryShardSize,
    rolloverMinIndexAge,
    rolloverMinDocCount,
    indexPatterns,
    priority,
    policyID,
  },
): { _id: string; policy: any } {
  content.policy.states[0].actions[0].rollover.min_primary_shard_size =
    content.policy.states[0].actions[0].rollover.min_primary_shard_size.replace(
      '${SHARD_SIZE}',
      rolloverMinPrimaryShardSize,
    );
  content.policy.states[0].actions[0].rollover.min_index_age =
    content.policy.states[0].actions[0].rollover.min_index_age.replace(
      '${MIN_INDEX_AGE}',
      rolloverMinIndexAge,
    );
  content.policy.states[0].actions[0].rollover.min_doc_count =
    rolloverMinDocCount;
  content.policy.ism_template.index_patterns = indexPatterns;
  content.policy.ism_template.priority = priority;
  return {
    _id: policyID,
    policy: content,
  };
}
