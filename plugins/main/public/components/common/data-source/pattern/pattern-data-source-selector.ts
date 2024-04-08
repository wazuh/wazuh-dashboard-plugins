import { tDataSourceSelector, tDataSourceRepository, tParsedIndexPattern } from '../index';
import { PatternDataSource } from './index';

export class PatternDataSourceSelector implements tDataSourceSelector<PatternDataSource> {
    // add a map to store locally the data sources
    private dataSources: Map<string, PatternDataSource> = new Map();

    constructor(dataSourcesList: PatternDataSource[], private repository: tDataSourceRepository<tParsedIndexPattern>) {
        if (!repository) {
            throw new Error('Data source repository is required');
        }
        if(!dataSourcesList || dataSourcesList?.length === 0) {
            throw new Error('Data sources list is required');
        }

        this.dataSources = new Map(dataSourcesList.map(dataSource => [dataSource.id, dataSource]));
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
    async getFirstValidDataSource(): Promise<PatternDataSource> {
        if (this.dataSources.size === 0) {
            throw new Error('No data sources found');
        }
        let index = 0;
        do {
            const dataSource = Array.from(this.dataSources.values())[index];
            if (await this.existsDataSource(dataSource.id)) {
                return dataSource;
            }
            index++;
        } while (index < this.dataSources.size);
        throw new Error('No valid data sources found');
    }

    /**
     * Get all the data sources from the repository.
     * When the map of the data sources is empty, get all the data sources from the repository.
    */

    async getAllDataSources(): Promise<PatternDataSource[]> {
        if (this.dataSources.size === 0) {
            throw new Error('No data sources found');
        }
        return Array.from(this.dataSources.values());
    }

    /**
     * Get a data source by a received ID.
     * When the map of the data sources is empty, get all the data sources from the repository.
     * When the data source is not found, an error is thrown.
     * @param id 
     */
    async getDataSource(id: string): Promise<PatternDataSource> {
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
        await this.repository.setDefault(dataSource.toJSON());
    }

    /**
     * Get the selected data source from the repository.
     * When the repository has a data source, return the selected data source.
     * When the repository does not have a selected data source, return the first valid data source.
     * When the repository throws an error, return the first valid data source.
     */
    async getSelectedDataSource(): Promise<PatternDataSource> {
        try {
            const defaultDataSource = await this.repository.getDefault();
            if (!defaultDataSource) {
                const validDataSource = await this.getFirstValidDataSource();
                await this.selectDataSource(validDataSource.id);
                return validDataSource;
            }
            
            return await this.getDataSource(defaultDataSource.id);
        } catch (error) {
            const validateDataSource = await this.getFirstValidDataSource();
            await this.selectDataSource(validateDataSource.id);
            return validateDataSource;
        }
    }

}