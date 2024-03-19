import { tDataSourceFactory, PatternDataSource, tDataSource, tParsedIndexPattern } from '../';
export class PatternDataSourceFactory implements tDataSourceFactory<tParsedIndexPattern, PatternDataSource>{
    
    create(item: tParsedIndexPattern): PatternDataSource {
        if(!item){
            throw new Error('Cannot create data source from null or undefined');
        };
        return new PatternDataSource(item.id, item.title);
    }
    createAll(items: tParsedIndexPattern[]): PatternDataSource[] {
        if(!items){
            throw new Error('Cannot create data source from null or undefined');
        };
        return items.map(item => this.create(item));
    }
}