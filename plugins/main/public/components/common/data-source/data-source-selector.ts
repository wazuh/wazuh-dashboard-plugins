import { DataSourceRepository } from './data-source-repository';
import { tDataSourceFactory } from './data-source-factory';
import { tDataSource } from "./data-source";

export type tDataSourceSelector = {
    existsDataSource: (id: string) => Promise<boolean>;
    getFirstValidDataSource: () => Promise<tDataSource>;
    getAllDataSources: () => Promise<tDataSource[]>;
    getDataSource: (id: string) => Promise<tDataSource>;
    getSelectedDataSource: () => Promise<tDataSource>;
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

    /**
     * Check if the data source exists in the repository.
     * @param id 
     */
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

    /**
     * Get the first valid data source from the repository.
     * Loop through the data sources and return the first valid data source.
     * Break the while when the valid data source is found
     */
    async getFirstValidDataSource(): Promise<tDataSource> {
        const dataSources = await this.getAllDataSources();
        if (dataSources.length === 0) {
            throw new Error('No data sources found');
        }
        let index = 0;
        do {
            const dataSource = dataSources[index];
            if (await this.existsDataSource(dataSource.id)) {
                return dataSource;
            }
            index++;
        } while (index < dataSources.length);
        throw new Error('No valid data sources found');
    }

    /**
     * Get all the data sources from the repository.
     * When the map of the data sources is empty, get all the data sources from the repository.
    */

    async getAllDataSources(): Promise<tDataSource[]> {
        if (this.dataSources.size === 0) {
            const dataSources = await this.factory.createAll(await this.repository.getAll());
            dataSources.forEach(dataSource => {
                this.dataSources.set(dataSource.id, dataSource);
            });
        }
        return Array.from(this.dataSources.values());
    }

    /**
     * Get a data source by a received ID.
     * When the map of the data sources is empty, get all the data sources from the repository.
     * When the data source is not found, an error is thrown.
     * @param id 
     */
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
        const dataSource = await this.getDataSource(id);
        if (!dataSource) {
            throw new Error('Data source not found');
        }
        await dataSource.select();
        await this.repository.setDefault(dataSource);
    }

    /**
     * Get the selected data source from the repository.
     * When the repository has a data source, return the selected data source.
     * When the repository does not have a selected data source, return the first valid data source.
     * When the repository throws an error, return the first valid data source.
     */
    async getSelectedDataSource(): Promise<tDataSource> {
        try {
            const defaultDataSource = await this.repository.getDefault();
            if (!defaultDataSource) {
                const validDataSource = await this.getFirstValidDataSource();
                await this.selectDataSource(validDataSource.id);
                return validDataSource;
            }
            return defaultDataSource;
        } catch (error) {
            const validateDataSource = await this.getFirstValidDataSource();
            await this.selectDataSource(validateDataSource.id);
            return validateDataSource;
        }
    }

}