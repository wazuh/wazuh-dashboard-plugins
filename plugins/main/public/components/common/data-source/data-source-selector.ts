import { DataSourceRepository } from './data-source-repository';
import { tDataSourceFactory } from './data-source-factory';
import { tDataSource } from "./data-source";

type tDataSourceSelector = {
    getAllDataSources: () => Promise<T[]>;
    getDataSource: (id: string) => Promise<T>;
    getSelectedDataSource: () => Promise<T>;
    selectDataSource: (id: string) => Promise<void>;
}


export class DataSourceSelector implements tDataSourceSelector {
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

    /**
     * Select a data source by a received ID.
     * When the data source is not found, an error is thrown.
     * When the data source is found, it is selected and set as the default data source.
     * @param id 
     */
    async selectDataSource(id: string): Promise<void> {
        const currentSelectedDataSource = await this.getSelectedDataSource();
        const dataSource = await this.getDataSource(id);
        if (!dataSource) {
            throw new Error('Data source not found');
        }
        await dataSource.select();
        await this.repository.setDefault(dataSource);
    }


    /**
     * Get the selected data source from the repository.
     */
    async getSelectedDataSource(): Promise<tDataSource> {
        const defaultDataSource = await this.repository.getDefault();
        if(!defaultDataSource){
            // if the data source is not saved on the repository, return the first one
            const dataSources = await this.getAllDataSources();
            return dataSources[0];
        }else{
            return defaultDataSource;
        }
    }

}