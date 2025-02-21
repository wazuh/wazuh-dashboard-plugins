import { QueryManagerConfig } from './query-manager-config';
import { DataService, IQueryManagerService } from './types';

export class QueryManagerFactory {
  constructor(private readonly dataService: DataService) {
    this.dataService = dataService;
  }

  async create(config: QueryManagerConfig): IQueryManagerService {
    const queryManagerService = new QueryManagerService(
      config,
      this.dataService,
    );

    return queryManagerService.init();
  }
}
