import { IConnectorRepository, CreateConnectorRequest } from './domain/types';
import { Connector } from './domain/connector';
import { ILogger } from '../installation-manager/domain/types';

export class CreateConnectorUseCase {
  constructor(
    private readonly connectorRepository: IConnectorRepository,
    private readonly logger: ILogger
  ) {}

  public async execute(request: CreateConnectorRequest): Promise<string> {
    this.logger.info(`Creating connector: ${request.name}`);
    
    const connector = Connector.create({
      name: request.name,
      description: request.description,
      endpoint: request.endpoint,
      model: request.model,
      apiKey: request.apiKey
    });
    
    const connectorId = await this.connectorRepository.create(connector);
    
    this.logger.info(`Connector created with ID: ${connectorId}`);
    return connectorId;
  }
}