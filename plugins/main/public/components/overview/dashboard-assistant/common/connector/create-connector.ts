import type { IConnectorRepository } from './domain/types';
import type { CreateConnectorRequest } from '../assistant-manager/domain/types';
import { Connector } from './domain/connector';

export class CreateConnectorUseCase {
  constructor(
    private readonly connectorRepository: IConnectorRepository
  ) {}

  public async execute(request: CreateConnectorRequest): Promise<string> {
    const connector = Connector.create({
      name: request.name,
      description: request.description,
      endpoint: request.endpoint,
      model: request.model,
      apiKey: request.apiKey
    });
    
    const connectorId = await this.connectorRepository.create(connector);
    
    return connectorId;
  }
}