import { ModelGroup } from '../../../domain/entities/model-group';

export class ModelGroupOpenSearchMapper {
  static toModel(model_group: {
    id: string;
    name: string;
    description: string;
  }): ModelGroup {
    return {
      id: model_group.id,
      name: model_group.name,
      description: model_group.description,
    };
  }
}
