import {
  DataService,
  IQueryManagerService,
  QueryManagerFactoryConfig,
  IQueryManagerConfig,
} from './types';
import { QueryManagerService } from './query-manager-service';
import { IndexPatternRepository } from './patterns-repository';

export class QueryManagerFactory {
  constructor(private readonly dataService: DataService) {
    this.dataService = dataService;
  }

  async create(
    config: QueryManagerFactoryConfig,
  ): Promise<IQueryManagerService> {
    const queryManagerConfig: IQueryManagerConfig = {
      indexPatterns: config.indexPatterns,
      dataService: this.dataService,
      patternsRepository: new IndexPatternRepository(
        this.dataService.indexPatterns,
      ),
    };
    const queryManagerService = new QueryManagerService(queryManagerConfig);

    await queryManagerService.init();

    return queryManagerService;
  }
}
