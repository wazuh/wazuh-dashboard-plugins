import { ModelGroup } from '../../domain/entities/model-group';

export interface CreateModelGroupDto
  extends Pick<ModelGroup, 'name' | 'description'> {}
