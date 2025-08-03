import { ProviderModelConfig } from '../../../../provider-model-config';

export interface CreateConnectorDto {
  name: string;
  description: string;
  endpoint: string;
  model_id: string;
  model_config: ProviderModelConfig;
  api_key: string;
}
