import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { updateClusterSettingsUseCase } from '../../cluster/update-cluster-settings';
import type { IClusterSettingsRepository } from '../../cluster/domain/types';

export class UpdateClusterSettingsStep implements IInstallationStep {
  constructor(
    private readonly clusterSettingsRepository: IClusterSettingsRepository,
  ) {}

  public getName(): string {
    return 'Update Cluster Settings';
  }

  public async execute(
    request: InstallDashboardAssistantRequest,
    context: InstallationContext,
  ): Promise<void> {
    const updateClusterSettings = updateClusterSettingsUseCase(
      this.clusterSettingsRepository,
    );
    await updateClusterSettings();
  }
}
