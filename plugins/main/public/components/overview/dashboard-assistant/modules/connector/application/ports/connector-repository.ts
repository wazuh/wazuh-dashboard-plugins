import {
  CreateRepository,
  DeleteRepository,
} from '../../../common/domain/entities/repository';
import { Connector } from '../../domain/entities/connector';
import { CreateConnectorDto } from '../dtos/create-connector-dto';

export interface ConnectorRepository
  extends CreateRepository<Connector, CreateConnectorDto>,
    DeleteRepository {}
