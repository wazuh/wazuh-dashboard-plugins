import type { IConnectorRepository } from './domain/types';
import type { CreateConnectorRequest } from '../assistant-manager/domain/types';
import { Connector } from './domain/connector';

export const createConnectorUseCase =
  (connectorRepository: IConnectorRepository) =>
  async (request: CreateConnectorRequest) => {
    const connector = Connector.create({
      name: request.name,
      description: request.description,
      endpoint: request.endpoint,
      model: request.model,
      apiKey: request.apiKey,
    });

    const connectorId = await connectorRepository.create(connector);

    return connectorId;
  };
