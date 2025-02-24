import { QueryManagerConfig } from './query-manager-config';
import { DataService, IQueryManagerService } from './types';
import { QueryManagerService } from './query-manager-service';

export class QueryManagerFactory {
  constructor(private readonly dataService: DataService) {
    this.dataService = dataService;
  }

  async create(config: QueryManagerConfig): Promise<IQueryManagerService> {
    const queryManagerService = new QueryManagerService(
      config,
      this.dataService,
    );

    await queryManagerService.init();

    return queryManagerService;
  }
}
