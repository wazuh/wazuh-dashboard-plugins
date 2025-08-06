import { MlCommonsPluginSettings } from '../../domain/entities/plugin-settings';
import { CreateMLCommonsDto } from '../../application/dtos/create-ml-commons-dto';

export class MLCommonsSettingsCreateFactory {
  public static create(config: CreateMLCommonsDto): MlCommonsPluginSettings {
    return {
      ml_commons: {
        agent_framework_enabled: true,
        only_run_on_ml_node: false,
        rag_pipeline_feature_enabled: true,
        trusted_connector_endpoints_regex: config.endpoints_regex,
      },
    };
  }
}
