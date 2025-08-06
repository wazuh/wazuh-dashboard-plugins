import { ConnectorAction } from '../../../domain/entities/connector-action';

export class ConnectorActionFactory {
  static create(action: {
    url: string;
    headers: Record<string, string>;
    request_body: string;
  }): ConnectorAction {
    return {
      action_type: 'predict',
      method: 'POST',
      url: action.url,
      headers: action.headers,
      request_body: action.request_body,
    };
  }
}
