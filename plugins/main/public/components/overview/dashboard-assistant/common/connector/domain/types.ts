import { Repository } from '../../domain/repository';
import { Connector } from './connector';

export interface IConnectorRepository extends Repository<Connector> {}

export interface CreateConnectorRequest {
  name: string;
  description: string;
  endpoint: string;
  model: string;
  apiKey: string;
}
