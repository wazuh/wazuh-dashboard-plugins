import { tDataSourceFactory, PatternDataSource, tDataSource, tParsedIndexPattern } from '../';
export class PatternDataSourceFactory implements tDataSourceFactory<tParsedIndexPattern, PatternDataSource>{
    async create(DataSourceType: new (id: string, title: string) => PatternDataSource, data: tParsedIndexPattern): Promise<PatternDataSource> {
        const dataSource = new DataSourceType(data.id, data.title);
        await dataSource.init();
        return dataSource;
    }
    async createAll(DataSourceType: new (id: string, title: string) => PatternDataSource, data: tParsedIndexPattern[]): Promise<PatternDataSource[]> {
        return Promise.all(data.map(async (d) => {
            return this.create(DataSourceType, d);
        }));
    }   
    
}