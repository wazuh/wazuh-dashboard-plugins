import { IInstallationStep } from '../types';
import { InstallDashboardAssistantRequest } from '../domain/types';
import { InstallationContext } from '../domain/installation-context';
import { UpdateClusterSettingsUseCase } from '../../cluster/update-cluster-settings';

export class UpdateClusterSettingsStep implements IInstallationStep {
  constructor(private readonly updateClusterSettingsUseCase: UpdateClusterSettingsUseCase) {}

  public getName(): string {
    return 'Update Cluster Settings';
  }

  public async execute(request: InstallDashboardAssistantRequest, context: InstallationContext): Promise<void> {
    await this.updateClusterSettingsUseCase.execute();
  }
}