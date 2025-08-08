import { Connector } from '../../../domain/entities/connector';

export interface ConnectorOpenSearchResponseDto
  extends Pick<
    Connector,
    'name' | 'description' | 'version' | 'protocol' | 'parameters' | 'actions'
  > {}
