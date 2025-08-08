import { ASSISTANT_PROMPT } from '../../../domain/constants';
import { CreateConnectorDto } from '../../../application/dtos/create-connector-dto';
import { ConnectorActionFactory } from './connector-action-factory';
import { ConnectorOpenSearchCreateDto } from '../dtos/connector-opensearch-create-dto';

export class ConnectorOpenSearchCreateFactory {
  static create(config: CreateConnectorDto): ConnectorOpenSearchCreateDto {
    const parameters = {
      model: config.model_id,
      messages: [
        {
          role: 'assistant',
          content: ASSISTANT_PROMPT,
        },
        { role: 'user', content: '${parameters.prompt}' },
      ],
      ...config.extra_parameters,
    };

    const credential = {
      api_key: config.api_key,
    };

    const actions = [
      ConnectorActionFactory.create({
        url: `https://${config.endpoint}${config.url_path}`,
        headers: config.headers,
        request_body: config.request_body,
      }),
    ];

    return {
      name: config.name,
      description: config.description,
      version: 1,
      protocol: 'http',
      parameters,
      credential,
      actions,
    };
  }
}
