import { ModelOpenSearchRequestCreateDto } from '../dtos/model-opensearch-request-create-dto';

export class ModelOpenSearchCreateFactory {
  static create(params: {
    name: string;
    model_group_id?: string;
    connector_id: string;
    description: string;
  }): ModelOpenSearchRequestCreateDto {
    const response: ModelOpenSearchRequestCreateDto = {
      name: params.name,
      connector_id: params.connector_id,
      description: params.description,
      function_name: 'remote',
    };

    if (params.model_group_id) {
      response.model_group_id = params.model_group_id;
    }

    return response;
  }
}
