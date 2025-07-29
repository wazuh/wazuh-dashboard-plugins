export class ClusterSettings {
  constructor(
    private readonly mlCommonsAgentFrameworkEnabled: boolean,
    private readonly onlyRunOnMlNode: boolean,
    private readonly ragPipelineFeatureEnabled: boolean,
    private readonly trustedConnectorEndpointsRegex: string[]
  ) {}

  public static create(config: {
    mlCommonsAgentFrameworkEnabled: boolean;
    onlyRunOnMlNode: boolean;
    ragPipelineFeatureEnabled: boolean;
    trustedConnectorEndpointsRegex: string[];
  }): ClusterSettings {
    return new ClusterSettings(
      config.mlCommonsAgentFrameworkEnabled,
      config.onlyRunOnMlNode,
      config.ragPipelineFeatureEnabled,
      config.trustedConnectorEndpointsRegex
    );
  }

  public toApiPayload(): object {
    return {
      persistent: {
        'plugins.ml_commons.agent_framework_enabled': this.mlCommonsAgentFrameworkEnabled,
        'plugins.ml_commons.only_run_on_ml_node': this.onlyRunOnMlNode.toString(),
        'plugins.ml_commons.rag_pipeline_feature_enabled': this.ragPipelineFeatureEnabled,
        'plugins.ml_commons.trusted_connector_endpoints_regex': this.trustedConnectorEndpointsRegex
      }
    };
  }
}