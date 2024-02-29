import { tDataSource } from "./data-source";
import { DataSourceFactory } from './data-source-factory';

export class DataSourceHandler {
    private dataSourceFactory: DataSourceFactory;

    constructor(dataSourceFactory: DataSourceFactory) {
        if(!dataSourceFactory) {
            throw new Error('Data source factory is required');
        }
        // check if a DataSourceFactory instance
        if(!(dataSourceFactory instanceof DataSourceFactory)){
            throw new Error('Invalid data source factory');
        }

        
        this.dataSourceFactory = dataSourceFactory;
    }

    getDataSources(): tDataSource[] {
        return this.dataSourceFactory.getDataSources();
    }

}