import { ISM_ROLLOVER_POLICY_FILE } from '../../../../../common/constants';
import { generateISMPolicyWithContent } from '../lib/get-ism-policy-content';
import { createISMPolicy, updateISMPolicy } from '../lib/manage-ism-policy';
import fs from 'fs';

export default async function (context, { opensearchClient, config }) {
  // Get the ISM policies
  const { name: policyName, path: policyPath } = context.job.policy;
  context.wazuh.logger.debug('Getting the ISM policies');
  const { policies = [] } = await opensearchClient.callAsInternalUser(
    'wzISM.getPolicies',
  );

  context.wazuh.logger.debug(
    `ISM policies found: [${policies.map(({ _id }) => _id).join(', ')}]`,
  );

  const indexPatternsWithoutISMPolicy = config[
    'ism.rollover.index_patterns'
  ].filter(indexPattern => {
    context.wazuh.logger.debug(
      `Checking if it exists a roll over ISM policy for ${indexPattern}`,
    );

    return !policies.some(({ _id, policy }) => {
      // ISM policy has rollover action in some of its states
      const policyHasRolloverAction = policy.states.reduce((accum, state) => {
        if (accum) {
          return accum;
        }
        // Some action of state is rollover action
        return state?.actions?.some(action => action.rollover);
      }, false);

      // ISM policy applies to the index pattern
      const policyApplyToIndexPattern = Array.isArray(policy?.ism_template)
        ? /*
          ism_template: {index_patterns: string[], priority: number}[]
        */
          policy?.ism_template.some(({ index_patterns }) =>
            index_patterns?.includes(indexPattern),
          )
        : /*
          ism_template: {index_patterns: string[], priority: number}
        */
          policy?.ism_template?.index_patterns?.includes(indexPattern);

      // Resolve policy with overwrite
      const resolvePolicyApplyToIndexPatternWithOverwrite =
        config['ism.rollover.overwrite'] &&
        _id === policyName &&
        policyApplyToIndexPattern
          ? false
          : policyApplyToIndexPattern;

      const rolloverISMPolicyFoundForIndexPattern =
        policyHasRolloverAction &&
        resolvePolicyApplyToIndexPatternWithOverwrite;

      rolloverISMPolicyFoundForIndexPattern &&
        context.wazuh.logger.debug(
          `ISM policy [${_id}] with roll over action found for [${indexPattern}]`,
        );
      return rolloverISMPolicyFoundForIndexPattern;
    });
  });

  // Check the default ISM policy exists

  const policyDefaultISMRollover = policies.find(
    ({ _id }) => _id === policyName,
  );

  if (policyDefaultISMRollover && !config['ism.rollover.overwrite']) {
    // If there are unmanaged index patterns by the policy
    if (indexPatternsWithoutISMPolicy.length) {
      context.wazuh.logger.warn(
        `ISM policy [${
          policyDefaultISMRollover._id
        }] already exists and some index patterns are not included: ${indexPatternsWithoutISMPolicy.join(
          ', ',
        )}. This change should be done manually through the Index Management application.`,
      );
    } else {
      context.wazuh.logger.debug(
        `ISM policy [${policyDefaultISMRollover._id}] already exists. You can use the ism.rollover.overwrite setting to overwrite the content.`,
      );
    }
  } else {
    /* Create the default ISM policy to apply to the index patterns that are not managed by an
        ISM policy that has the roll over action
      */
    if (indexPatternsWithoutISMPolicy.length) {
      context.wazuh.logger.info(
        `Index patterns found without roll over ISM policy: ${indexPatternsWithoutISMPolicy.join(
          ', ',
        )}`,
      );

      // Create ISM policy for index pattern without roll over policy

      context.wazuh.logger.debug(`Reading [${ISM_ROLLOVER_POLICY_FILE}]`);

      const content = JSON.parse(
        fs.readFileSync(ISM_ROLLOVER_POLICY_FILE, {
          encoding: 'utf-8',
        }),
      );

      const policy = generateISMPolicyWithContent(content, {
        rolloverMinDocCount: config['ism.rollover.min_doc_count'],
        rolloverMinIndexAge: config['ism.rollover.min_index_age'],
        rolloverMinPrimaryShardSize:
          config['ism.rollover.min_primary_shard_size'],
        indexPatterns: indexPatternsWithoutISMPolicy,
        priority: config['ism.rollover.priority'],
        policyID: policyName,
      });

      context.wazuh.logger.debug(
        `Generated ISM policy content [${JSON.stringify(policy)}]`,
      );

      if (!policyDefaultISMRollover) {
        context.wazuh.logger.debug(
          `Creating ISM policy with ID [${
            policy._id
          }] and body [${JSON.stringify(policy)}]`,
        );
        const response = await createISMPolicy({ opensearchClient }, policy);
        context.wazuh.logger.debug(
          `Created policy with ID [${
            response._id
          }] and response: [${JSON.stringify(response)}]`,
        );
        context.wazuh.logger.info(
          `Created ISM policy with ID [${response._id}]`,
        );
      } else if (policyDefaultISMRollover && config['ism.rollover.overwrite']) {
        context.wazuh.logger.debug(
          `Overwriting policy with ID [${policy._id}]`,
        );
        context.wazuh.logger.debug(
          `Updating ISM policy with ID [${
            policy._id
          }] and body [${JSON.stringify(policy.policy)}]`,
        );
        const response = await updateISMPolicy(
          { opensearchClient },
          {
            ...policy,
            ifSeqNo: policyDefaultISMRollover._seq_no,
            ifPrimaryTerm: policyDefaultISMRollover._primary_term,
          },
        );
        context.wazuh.logger.debug(
          `Updated policy with ID [${
            response._id
          }] and response [${JSON.stringify(response)}]`,
        );
        context.wazuh.logger.info(`Updated ISM policy with ID [${policy._id}]`);
        context.wazuh.logger.info(`Overwrote policy with ID [${policy._id}]`);
      }
    }
  }
}
