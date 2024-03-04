import { DataSourceRepository } from './data-source-repository';
import { tDataSourceFactory } from './data-source-factory';
import { tDataSource } from "./data-source";

type tDataSourceSelector<T extends tDataSource> = {
    getAllDataSources: () => Promise<T[]>;
    getDataSource: (id: string) => Promise<T>;
    getSelectedDataSource: () => Promise<T>;
    selectDataSource: (id: string) => Promise<void>;
}


export class DataSourceSelector {
    // add a map to store locally the data sources
    private dataSources: Map<string, tDataSource> = new Map();

    constructor(private repository: DataSourceRepository, private factory: tDataSourceFactory) {
        if (!repository) {
            throw new Error('Data source repository is required');
        }
        if (!factory) {
            throw new Error('Data source factory is required');
        }
    }

    async getAllDataSources(): Promise<tDataSource[]> {
        // when the map of the data sources is empty, get all the data sources from the repository
        if (this.dataSources.size === 0) {
            const dataSources = await this.factory.createAll(await this.repository.getAll());
            dataSources.forEach(dataSource => {
                this.dataSources.set(dataSource.id, dataSource);
            });
        }
        return Array.from(this.dataSources.values());
    }

    async getDataSource(id: string): Promise<tDataSource> {
        // when the map of the data sources is empty, get all the data sources from the repository
        if (this.dataSources.size === 0) {
            await this.getAllDataSources();
        }
        const dataSource = this.dataSources.get(id);
        if (!dataSource) {
            throw new Error('Data source not found');
        }
        return dataSource;
    }


    async selectDataSource(id: string): Promise<void> {
        const dataSource = await this.getDataSource(id);
        if(!dataSource){
            throw new Error('Data source not found');
        }
        this.repository.setDefault(dataSource);
    }

    async getSelectedDataSource(): Promise<tDataSource> {
        return await this.repository.getDefault();
    }


}