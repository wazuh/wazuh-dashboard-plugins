import { UseCases } from '../../../../setup';
import { CreateModelDto } from '../../../model/application/dtos/create-model-dto';
import {
  InstallationContext,
  InstallationAIAssistantStep,
  InstallAIDashboardAssistantDto,
} from '../../domain';

export class CreateModelStep extends InstallationAIAssistantStep {
  constructor() {
    super({ name: 'Create Model' });
  }

  async execute(
    request: InstallAIDashboardAssistantDto,
    context: InstallationContext,
  ): Promise<void> {
    const modelDto: CreateModelDto = {
      connector_id: context.get('connectorId'),
      name: request.model.name,
      description: request.model.description,
    };

    const model = await UseCases.createModel(modelDto);
    context.set('modelId', model.id);
  }

  getSuccessMessage(): string {
    return 'Model created successfully';
  }

  getFailureMessage(): string {
    return 'Failed to create model. Please check the configuration and try again.';
  }
}
