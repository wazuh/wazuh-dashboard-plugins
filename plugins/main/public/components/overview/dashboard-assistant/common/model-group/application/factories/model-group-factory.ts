import { ModelGroup } from '../../domain/model-group';

export const ModelGroupFactory = {
  fromResponse: (model_group: {
    id: string;
    name: string;
    description: string;
  }): ModelGroup => {
    return {
      id: model_group.id,
      name: model_group.name,
      description: model_group.description,
    };
  },
};
