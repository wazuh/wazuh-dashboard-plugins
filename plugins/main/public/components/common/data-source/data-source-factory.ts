import { tDataSource } from './data-source';

export abstract class DataSourceFactory {
    abstract getDataSources(): tDataSource[];
    abstract createDataSources(): tDataSource[];
    abstract validateDataSources(dataSources: tDataSource[]): boolean;
}