import { ConnectorAction } from '../../domain/entities/connector-action';

export class ConnectorActionFactory {
  static create(action: {
    action_type?: string;
    method?: string;
    url: string;
    headers: Record<string, string>;
    request_body: string;
  }): ConnectorAction {
    return {
      action_type: action.action_type || 'predict',
      method: action.method || 'POST',
      url: action.url,
      headers: action.headers,
      request_body: action.request_body,
    };
  }
}
