import type { IClusterSettingsRepository } from './domain/types';
import { ClusterSettings } from './domain/cluster-settings';

export class UpdateClusterSettingsUseCase {
  constructor(
    private readonly clusterSettingsRepository: IClusterSettingsRepository
  ) {}

  public async execute(): Promise<void> {
    const settings = ClusterSettings.create({
      mlCommonsAgentFrameworkEnabled: true,
      onlyRunOnMlNode: false,
      ragPipelineFeatureEnabled: true,
      trustedConnectorEndpointsRegex: ['.*']
    });
    
    await this.clusterSettingsRepository.updateSettings(settings);
  }
}