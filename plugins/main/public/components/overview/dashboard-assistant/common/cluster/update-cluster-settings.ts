import type { IClusterSettingsRepository } from './domain/types';
import { ClusterSettings } from './domain/cluster-settings';

export const updateClusterSettingsUseCase = (clusterSettingsRepository: IClusterSettingsRepository) => async (): Promise<void> => {
  const settings = ClusterSettings.create({
    mlCommonsAgentFrameworkEnabled: true,
    onlyRunOnMlNode: false,
    ragPipelineFeatureEnabled: true,
    trustedConnectorEndpointsRegex: ['.*']
  });
  
  await clusterSettingsRepository.updateSettings(settings);
}