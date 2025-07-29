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
    private readonly actions: ConnectorAction[]
  ) {}

  public static create(config: {
    name: string;
    description: string;
    endpoint: string;
    model: string;
    apiKey: string;
  }): Connector {
    const parameters = new ConnectorParameters(
      config.endpoint,
      config.model,
      [
        { role: 'developer', content: 'You are a helpful assistant.' },
        { role: 'user', content: '${parameters.prompt}' }
      ]
    );

    const credential = new ConnectorCredential(config.apiKey);
    
    const actions = [
      new ConnectorAction(
        'predict',
        'POST',
        `https://${config.endpoint}/v1/chat/completions`,
        { 'Authorization': `Bearer ${credential.openAIKey}` },
        '{ "model": "${parameters.model}", "messages": ${parameters.messages} }'
      )
    ];

    return new Connector(
      null,
      config.name,
      config.description,
      1,
      'http',
      parameters,
      credential,
      actions
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
      actions: this.actions.map(action => action.toObject())
    };
  }
}