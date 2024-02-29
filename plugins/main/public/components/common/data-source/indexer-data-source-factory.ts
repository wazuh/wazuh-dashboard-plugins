import { tDataSource } from "./data-source";
import { DataSourceFactory } from "./data-source-factory";
import { IndexerDataSource } from "./indexer-data-source";

export class IndexerDataSourceFactory extends DataSourceFactory {
    validateDataSources(dataSources: tDataSource[]): boolean {
        throw new Error("Method not implemented.");
    }
    createDataSources(): tDataSource[] {
        throw new Error("Method not implemented.");
    }
    getDataSources(): tDataSource[] {
        return [new IndexerDataSource('id','title')];
    }
}
