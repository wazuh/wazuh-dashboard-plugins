import { ConnectorAction } from './connector-action';

export interface Connector {
  id?: string;
  name: string;
  description: string;
  version: number;
  protocol: string;
  parameters: Record<string, any>;
  credential: Record<string, string>;
  actions: ConnectorAction[];
}
