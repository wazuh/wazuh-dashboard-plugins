import { Connector } from '../../../domain/entities/connector';
import { ConnectorOpenSearchCreateDto } from '../dtos/connector-opensearch-create-dto';
import { ConnectorOpenSearchResponseDto } from '../dtos/connector-opensearch-response-dto';

export class ConnectorOpenSearchMapper {
  static fromRequest(
    id: string,
    config: ConnectorOpenSearchCreateDto,
  ): Connector {
    return {
      id,
      name: config.name,
      description: config.description,
      version: config.version,
      protocol: config.protocol,
      parameters: config.parameters,
      actions: config.actions,
    };
  }

  static fromResponse(
    id: string,
    config: ConnectorOpenSearchResponseDto,
  ): Connector {
    return {
      id,
      name: config.name,
      description: config.description,
      version: config.version,
      protocol: config.protocol,
      parameters: config.parameters,
      actions: config.actions,
    };
  }
}
