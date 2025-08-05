import { CreateConnectorDto } from '../dtos/create-connector-dto';
import type { ConnectorRepository } from '../ports/connector-repository';

export const createConnectorUseCase =
  (connectorRepository: ConnectorRepository) =>
  async (connectorDto: CreateConnectorDto) => {
    return await connectorRepository.create(connectorDto);
  };
