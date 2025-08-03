import { ASSISTANT_PROMPT } from '../../domain/constants';
import { Connector } from '../../domain/entities/connector';
import { CreateConnectorDto } from '../dtos/create-connector-dto';
import { ConnectorActionFactory } from './connector-action-factory';

export class ConnectorFactory {
  static create(config: CreateConnectorDto): Connector {
    const parameters = {
      model: config.model_id,
      messages: [
        {
          role: 'assistant',
          content: ASSISTANT_PROMPT,
        },
        { role: 'user', content: '${parameters.prompt}' },
      ],
    };

    const credential = {
      api_key: config.api_key,
    };

    const actions = [
      ConnectorActionFactory.create({
        url: `https://${config.endpoint}${config.model_config.url_path}`,
        headers: config.model_config.headers,
        request_body: config.model_config.request_body,
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

  /**
    Example Response:
    ```json
    {
      "connector_id": "qqCDaJgBMotnYQO0XfoE"
    }
    ```
  */
  static fromResponse(
    config: Exclude<Connector, 'id'> & { connector_id: string },
  ): Connector {
    return {
      id: config.connector_id,
      ...config,
    };
  }
}
