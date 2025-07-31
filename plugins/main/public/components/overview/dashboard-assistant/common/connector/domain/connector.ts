import { ConnectorParameters } from './connector-parameters';
import { ConnectorCredential } from './connector-credential';
import { ConnectorAction } from './connector-action';

export class Connector {
  constructor(
    private readonly id: string | null,
    private readonly name: string,
    private readonly description: string,
    private readonly version: number,
    private readonly protocol: string,
    private readonly parameters: ConnectorParameters,
    private readonly credential: ConnectorCredential,
    private readonly actions: ConnectorAction[],
  ) {}

  public static create(config: {
    name: string;
    description: string;
    endpoint: string;
    model: string;
    apiKey: string;
  }): Connector {
    const parameters = new ConnectorParameters(config.endpoint, config.model, [
      { role: 'developer', content: 'You are a helpful assistant.' },
      { role: 'user', content: '${parameters.prompt}' },
    ]);

    const credential = new ConnectorCredential(config.apiKey);

    const actions = [
      new ConnectorAction(
        'predict',
        'POST',
        `https://${config.endpoint}/v1/chat/completions`,
        { Authorization: `Bearer ${credential.openAIKey}` },
        '{ "model": "${parameters.model}", "messages": ${parameters.messages} }',
      ),
    ];

    return new Connector(
      null,
      config.name,
      config.description,
      1,
      'http',
      parameters,
      credential,
      actions,
    );
  }

  public getId(): string | null {
    return this.id;
  }

  public toApiPayload(): object {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      protocol: this.protocol,
      parameters: this.parameters.toObject(),
      credential: this.credential.toObject(),
      actions: this.actions.map(action => action.toObject()),
    };
  }

  public static fromResponse(data: any): Connector {
    // TODO: Implement proper parsing from API response
    // For now, create a basic connector with available data
    const parameters = new ConnectorParameters(
      data.parameters?.endpoint || 'api.openai.com',
      data.parameters?.model || 'gpt-3.5-turbo',
      data.parameters?.messages || []
    );
    
    const credential = new ConnectorCredential(
      data.credential?.api_key || data.credential?.openai_key || ''
    );
    
    const actions = (data.actions || []).map((action: any) => 
      new ConnectorAction(
        action.action_type || 'predict',
        action.method || 'POST',
        action.url || '',
        action.headers || {},
        action.request_body || ''
      )
    );

    return new Connector(
      data.connector_id || data.id || null,
      data.name || 'Unknown Connector',
      data.description || '',
      data.version || 1,
      data.protocol || 'http',
      parameters,
      credential,
      actions
    );
  }
}
