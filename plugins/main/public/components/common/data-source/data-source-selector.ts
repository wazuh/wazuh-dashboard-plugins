import { DataSourceRepository } from './data-source-repository';
import { tDataSourceFactory } from './data-source-factory';
import { tDataSource } from "./data-source";

export type tDataSourceSelector = {
    getAllDataSources: () => Promise<tDataSource[]>;
    getDataSource: (id: string) => Promise<tDataSource>;
    getSelectedDataSource: () => Promise<tDataSource>;
    selectDataSource: (id: string) => Promise<void>;
    existsDataSource: (id: string) => Promise<boolean>;
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
    async existsDataSource(id: string): Promise<boolean> {
        try {
            if (!id) {
                throw new Error('Error checking data source. ID is required');
            }
            const dataSource = await this.repository.get(id);
            return !!dataSource;
        } catch (error) {
            return false;
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
        if (!id) {
            throw new Error('Error selecting data source. ID is required');
        }
        const currentSelectedDataSource = await this.getSelectedDataSource();
        const dataSource = await this.getDataSource(id);
        if (!dataSource) {
            throw new Error('Data source not found');
        }
        await dataSource.select();
        await this.repository.setDefault(dataSource);
    }

    async getDataSourceByIndex(id: string | null): Promise<tDataSource> {
        if (!id) {
            const dataSources = await this.getAllDataSources();
            return dataSources[0];
        }
        return await this.getDataSource(id);
    }

    /**
     * Get the selected data source from the repository.
     */
    async getSelectedDataSource(): Promise<tDataSource> {
        try {
            const defaultDataSource = await this.repository.getDefault();
            // when the default data source is not found, return the first one of the map
            if (!defaultDataSource) {
                // if the data source is not saved on the repository, return the first one
                const firstDataSource = await this.getDataSourceByIndex(null);
                await firstDataSource.select();
                await this.repository.setDefault(firstDataSource);
                return firstDataSource;
            } else {
                // if exists check if the data source is in the map
                const dataSource = this.dataSources.get(defaultDataSource.id);
                if (!dataSource) {
                    const firstDataSource = await this.getDataSourceByIndex(null);
                    await firstDataSource.select();
                    await this.repository.setDefault(firstDataSource);
                    return firstDataSource;
                } else {
                    return dataSource;
                }
            }
        } catch (error) {
            const firstDataSource = await this.getDataSourceByIndex(null);
            await firstDataSource.select();
            await this.repository.setDefault(firstDataSource);
            return firstDataSource;
        }
    }

}