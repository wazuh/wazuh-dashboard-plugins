import { tDataSource, tParsedIndexPattern, tDataSourceFactory } from "../../index";
import { VulnerabilitiesDataSource } from "./vulnerabilities-data-source";

export class VulnerabilitiesDataSourceFactory implements tDataSourceFactory<tParsedIndexPattern, VulnerabilitiesDataSource> {
    
    async create(item: tParsedIndexPattern): Promise<VulnerabilitiesDataSource> {
        if(!item){
            throw new Error('Cannot create data source from null or undefined');
        };
        const dataSource = new VulnerabilitiesDataSource(item.id, item.attributes.title);
        await dataSource.init();
        return dataSource;
    }
    async createAll(items: tParsedIndexPattern[]): Promise<VulnerabilitiesDataSource[]> {
        if(!items){
            throw new Error('Cannot create data source from null or undefined');
        };
        
        const dataSources: VulnerabilitiesDataSource[] = [];
        for (const item of items) {
            const dataSource = new VulnerabilitiesDataSource(item.id, item.attributes.title);
            await dataSource.init();
            dataSources.push(dataSource);
        }
        return dataSources;
    }
}