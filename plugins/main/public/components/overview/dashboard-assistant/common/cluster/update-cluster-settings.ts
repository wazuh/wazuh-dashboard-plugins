import { IClusterSettingsRepository } from './domain/types';
import { ClusterSettings } from './domain/cluster-settings';
import { ILogger } from '../installation-manager/domain/types';

export class UpdateClusterSettingsUseCase {
  constructor(
    private readonly clusterSettingsRepository: IClusterSettingsRepository,
    private readonly logger: ILogger
  ) {}

  public async execute(): Promise<void> {
    this.logger.info('Updating cluster settings for ML Commons');
    
    const settings = ClusterSettings.create({
      mlCommonsAgentFrameworkEnabled: true,
      onlyRunOnMlNode: false,
      ragPipelineFeatureEnabled: true,
      trustedConnectorEndpointsRegex: [
        '^https://runtime\\.sagemaker\\..*[a-z0-9-]\\.amazonaws\\.com/.*$',
        '^https://api\\.openai\\.com/.*$',
        '^https://api\\.cohere\\.ai/.*$',
        '^https://bedrock-runtime\\..*[a-z0-9-]\\.amazonaws\\.com/.*$'
      ]
    });

    await this.clusterSettingsRepository.updateSettings(settings);
    this.logger.info('Cluster settings updated successfully');
  }
}