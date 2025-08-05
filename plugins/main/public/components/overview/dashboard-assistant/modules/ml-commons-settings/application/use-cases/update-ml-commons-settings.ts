import type { MLCommonsSettingsRepository } from '../ports/ml-commons-settings-repository';
import { MLCommonsSettingsFactory } from '../factories/ml-commons-settings-factory';

export const persistMLCommonsSettingsUseCase =
  (MlCommonsSettingsRepository: MLCommonsSettingsRepository) =>
  async (endpoints_regex: string[]): Promise<void> => {
    const settings = MLCommonsSettingsFactory.create({
      agent_framework_enabled: true,
      only_run_on_ml_node: false,
      rag_pipeline_feature_enabled: true,
      trusted_connector_endpoints_regex: endpoints_regex,
    });

    await MlCommonsSettingsRepository.persist(settings);
  };
