# Description

This task is run when the plugin starts on the server side.

The objetive is:

- create templates for `wazuh-alerts-*` and `wazuh-archives-*` with configuration related to the rollover alias.
- create a ISM policy with rollover action for the configured indices (related to alerts/archives).
- create the indices to roll over related to `<wazuh-archives-4.x-{now/d}-000001>` and `<wazuh-archives-4.x-{now/d}-000001>`.

# Job settings

This job is managed by the following settings:

| key                                   | allowed values             | default value                                                      | description                                                                                                                                     |
| ------------------------------------- | -------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `ism.rollover.enabled`                | boolean ( `true`/`false` ) | `true`                                                             | Enable or disable the task to adding a roll over ISM policy, alias templates and create the rollover indices.                                   |
| `ism.rollover.index_patterns`         | string[]                   | `['wazuh-alerts-*','wazuh-archives-*''-wazuh-alerts-4.x-sample*']` | Index patterns to apply the roll over ISM policy.                                                                                               |
| `ism.rollover.min_doc_count`          | number                     | `200000000`                                                        | Define the minimum documents count required to roll over the index. This value is the results of docs_by_shard \* number_of_shards.             |
| `ism.rollover.min_index_age`          | string: number + unit time | `7d`                                                               | Define the minimum age required to roll over the index.                                                                                         |
| `ism.rollover.min_primary_shard_size` | number                     | `25`                                                               | Define the minimum storage size in (GiB) of a single primary shard required to roll over the index. Recommended size should be greater than 10. |
| `ism.rollover.overwrite`              | boolean (`true`/`false`)   | `false`                                                            | Overwrite the ${ISM_ROLLOVER_POLICY_NAME} ISM policy with the current configuration. This requires to restart ${PLUGIN_PLATFORM_NAME}.          |
| `ism.rollover.priority`               | number                     | `50`                                                               | Define the priority of the ISM policy template.                                                                                                 |

# Tasks

Flow:

```mermaid
flowchart TD
    job_ism_rollover[job ISM Rollover] --> question_installed_index_management_plugin{Is the index management plugin installed?}
    question_installed_index_management_plugin --> response_no_installed_index_management_plugin[No] --> job_ism_rollover_skip[Skip]
    question_installed_index_management_plugin --> response_yes_installed_index_management_plugin[Yes] --> question_job_ism_rollover_enabled{Is the job enabled?}
    question_job_ism_rollover_enabled --> response_yes_job_ism_rollover_enabled[Yes] --> job_ism_rollover_task_create_templates[Create templates roll over alias] --> job_ism_rollover_task_create_ism[Create ISM policy] --> job_ism_rollover_task_create_rollover_indices[Create roll over indices]
    question_job_ism_rollover_enabled --> response_no_job_ism_rollover_enabled[No] --> job_ism_rollover_skip[Skip]
```

The job is executed if the index management plugin is installed and the job is enabled through the `ism.rollover.enabled` setting. This condition is used to ensure the ISM plugins in Wazuh dashboard and Wazuh indexer are installed. This could mitigate some problems related to custom configuration of Wazuh dashboard if the plugin is not installed.

## Create the template with roll over alias

This task creates the templates with roll over alias for the index patterns:

- `wazuh-alerts-*`
- `wazuh-archives-*`

Flow:

```mermaid
flowchart TB
    subgraph check_template[Check template]
        get_template[Get template with name] -- GET /_template/name --> question_exist_template{Does the template exist?}
        question_exist_template --> response_yes_exist_template[Yes] --> skip[Skip]
        question_exist_template --> response_no_exist_template[No]
        response_no_exist_template --> create_template_from_file[Create template from file] -- PUT /_template/name --> created_template[Template created]
    end

    check_template_index_patterns[For index patterns: wazuh-alerts-*, wazuh-archives-*] --> check_template
```

## Create the roll over ISM policy

This task creates a roll over ISM policy with the following configuration:

- `ism.rollover.index_patterns`: Index patterns to apply the roll over ISM policy.
- `ism.rollover.min_index_age`: Define the minimum age required to roll over the index.
- `ism.rollover.min_doc_count`: Define the minimum documents count required to roll over the index. This value depends on number of shards and the documents by shards. The maximum documents by shard is 2^31.
  > This value is the result of:
  >
  > ```
  > min_doc_count = docs_by_shard * number_of_shards
  > ```
  >
  > :warning: The `docs_by_shard` is limited to 2^31.
- `ism.rollover.min_primary_shard_size`: Define the minimum storage size in (GiB) of a single primary shard required to roll over the index. Recommended size should be greater than 10.
- `ism.rollover.overwrite`: Overwrite the roll over default ISM policy with the current configuration. This requires to restart the platform.
- `ism.rollover.priority`: Define the priority of the ISM policy template.

Flow:

```mermaid
flowchart TB
    subgraph check_configured_index_patterns_has_no_rollover_policy[Check the index patterns has no a rollover policy]
        question_is_overwrite_enabled{Is ism.rollover.overwrite enabled?} --> response_yes_is_overwrite_enabled[Yes] --> ignore_configured_index_patterns_in_default_policy[Ignore configured index patterns in default policy]
        question_is_overwrite_enabled{Is ism.rollover.overwrite enabled?} --> response_no_is_overwrite_enabled[No]
        response_no_is_overwrite_enabled --> question_policies_without_rollover_ism_policy
        ignore_configured_index_patterns_in_default_policy -->  question_policies_without_rollover_ism_policy{"`
        Are index patterns there without roll over ISM policy?`"}
        question_policies_without_rollover_ism_policy --> response_yes_policies_without_rollover_ism_policy[Yes] --> question_index_patterns_without_rollover_ism_policy_is_overwrite_enabled{Is ism.rollover.overwrite enabled?}
        question_policies_without_rollover_ism_policy --> response_no_policies_without_rollover_ism_policy[No]
        question_index_patterns_without_rollover_ism_policy_is_overwrite_enabled --> respose_yes_index_patterns_without_rollover_ism_policy_is_overwrite_enabled[Yes]
        question_index_patterns_without_rollover_ism_policy_is_overwrite_enabled --> respose_no_index_patterns_without_rollover_ism_policy_is_overwrite_enabled[No] --> respose_no_index_patterns_without_rollover_ism_policy_is_overwrite_enabled_skip[Skip]
    end

    get_ism_policies[Get the ISM policies] -- GET /_plugins/_ism/policies --> check_configured_index_patterns_has_no_rollover_policy
    respose_yes_index_patterns_without_rollover_ism_policy_is_overwrite_enabled[Yes] --> create_ism_rollover_policy[Create/Update roll over ISM policy]
    response_no_policies_without_rollover_ism_policy --> create_ism_rollover_policy -- PUT /_plugins/_ism/policy_id --> created_ism_rollover_policy[ISM policy created/updated]
```

## Create the roll over indices

This task creates the roll over indices with the alias configuration from files for the index patterns:

Flow:

```mermaid
flowchart TB
    subgraph check_indices[Check indices]
        get_index[Get index with name] -- HEAD /date_math_index_name --> question_exist_index{Does the index exist?}
        question_exist_index --> response_yes_exist_index[Yes] --> skip[Skip]
        question_exist_index --> response_no_exist_index[No]
        response_no_exist_index --> create_index_from_file[Create index with date math name with configuration from file] -- PUT /date_math_index_name --> created_index[Index created]
    end

    check_indices_index_patterns["For index patterns: wazuh-archives-4.x-{now/d}-000001, wazuh-archives-4.x-{now/d}-000001"] --> check_indices
```

## Logging

The job logs information to the platform and plugin.

A service was created to wrap these logging systems and reduce the logic in the job.

These logs can be filtered by `ism-rollover`.
