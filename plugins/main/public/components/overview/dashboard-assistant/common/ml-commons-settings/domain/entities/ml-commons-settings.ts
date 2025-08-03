export interface MLCommonsSettings {
  agent_framework_enabled: boolean;
  only_run_on_ml_node: boolean;
  rag_pipeline_feature_enabled: boolean;
  trusted_connector_endpoints_regex: string[];
}
