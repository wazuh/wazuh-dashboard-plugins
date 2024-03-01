import { tDataSource } from "./data-source";
import { DataSourceRepository } from './data-source-repository';

export class DataSourceService {
    constructor(private repository: DataSourceRepository, private factory: DataSourceFactory) {
        if(!repository) {
            throw new Error('Data source repository is required');
        }

        if(!factory) {
            throw new Error('Data source factory is required');
        }
    }

    async getAllDataSources(): Promise<tDataSource[]> {
        return this.factory.createAll(await this.repository.getAll());
    }

    async getDataSource(id: string): Promise<tDataSource> {
        return this.factory.create(await this.repository.get(id));
    }

}