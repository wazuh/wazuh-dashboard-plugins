import { ClusterSettings } from '../../domain/entities/cluster-settings';

export class MLCommonsSettingsFactory {
  public static create(config: {
    agent_framework_enabled: boolean;
    only_run_on_ml_node: boolean;
    rag_pipeline_feature_enabled: boolean;
    trusted_connector_endpoints_regex: string[];
  }): ClusterSettings {
    return {
      persistent: {
        plugins: {
          ml_commons: {
            agent_framework_enabled: config.agent_framework_enabled,
            only_run_on_ml_node: config.only_run_on_ml_node,
            rag_pipeline_feature_enabled: config.rag_pipeline_feature_enabled,
            trusted_connector_endpoints_regex:
              config.trusted_connector_endpoints_regex,
          },
        },
      },
    };
  }
}
