import { CreateModelDto } from '../../../application/dtos/create-model-dto';

export interface ModelOpenSearchRequestCreateDto extends CreateModelDto {
  function_name: string; // e.g., 'remote'
}
