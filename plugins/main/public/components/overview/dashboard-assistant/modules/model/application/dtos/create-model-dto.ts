export interface CreateModelDto {
  name: string;
  model_group_id?: string;
  description: string;
  connector_id: string;
  function_name: string;
}

export const buildCreateModelDto = (params: {
  name: string;
  description: string;
  connectorId: string;
  modelGroupId?: string;
}): CreateModelDto => {
  return {
    name: params.name,
    description: params.description,
    connector_id: params.connectorId,
    model_group_id: params.modelGroupId,
    function_name: 'remote',
  };
};
