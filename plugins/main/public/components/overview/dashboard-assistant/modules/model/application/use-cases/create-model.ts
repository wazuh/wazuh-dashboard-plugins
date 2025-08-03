import { CreateModelDto } from '../dtos/create-model-dto';
import { ModelRepository } from '../ports/model-repository';

export const createModelUseCase =
  (modelRepository: ModelRepository) =>
  async (createModelDto: CreateModelDto) => {
    const model = await modelRepository.create(createModelDto);

    return model;
  };
