import { Connector } from '../../../domain/entities/connector';

export interface ConnectorOpenSearchCreateDto
  extends Pick<
    Connector,
    'name' | 'description' | 'version' | 'protocol' | 'parameters' | 'actions'
  > {
  credential: Record<string, string>;
}
