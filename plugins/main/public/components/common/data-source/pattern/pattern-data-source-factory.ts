import { tDataSourceFactory, PatternDataSource, tDataSource, tParsedIndexPattern } from '../';
export class PatternDataSourceFactory implements tDataSourceFactory<tParsedIndexPattern, PatternDataSource>{
    
    async create(item: tParsedIndexPattern): Promise<PatternDataSource> {
        if(!item){
            throw new Error('Cannot create data source from null or undefined');
        };
        const dataSource = new PatternDataSource(item.id, item.attributes.title);
        await dataSource.init();
        return dataSource;
    }
    async createAll(items: tParsedIndexPattern[]): Promise<PatternDataSource[]> {
        if(!items){
            throw new Error('Cannot create data source from null or undefined');
        };
        
        const dataSources: PatternDataSource[] = [];
        for (const item of items) {
            const dataSource = new PatternDataSource(item.id, item.attributes.title);
            await dataSource.init();
            dataSources.push(dataSource);
        }
        return dataSources;
    }
}