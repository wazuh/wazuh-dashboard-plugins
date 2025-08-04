import { CreateConnectorDto } from '../dtos/create-connector-dto';
import type { IConnectorRepository } from '../ports/connector-repository';

export const createConnectorUseCase =
  (connectorRepository: IConnectorRepository) =>
  async (connectorDto: CreateConnectorDto) => {
    return await connectorRepository.create(connectorDto);
  };
