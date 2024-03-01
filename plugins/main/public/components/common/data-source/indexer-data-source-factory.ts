import { tDataSourceFactory, IndexerDataSource } from './index'
export class IndexerDataSourceFactory implements tDataSourceFactory {
    
    create(item: IndexerDataSource): IndexerDataSource {
        if(!item){
            throw new Error('Cannot create data source from null or undefined');
        };
        return new IndexerDataSource(item.id, item.title);
    }
    createAll(items: IndexerDataSource[]): IndexerDataSource[] {
        if(!items){
            throw new Error('Cannot create data source from null or undefined');
        };
        return items.map(item => this.create(item));
    }
}