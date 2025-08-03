export interface CreateModelDto {
  name: string;
  model_group_id?: string;
  description: string;
  connector_id: string;
  function_name: string;
}
