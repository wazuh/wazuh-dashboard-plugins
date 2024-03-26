import { tDataSourceFactory, PatternDataSource } from '../';
export class PatternDataSourceFactory implements tDataSourceFactory {
    
    create(item: PatternDataSource): PatternDataSource {
        if(!item){
            throw new Error('Cannot create data source from null or undefined');
        };
        return new PatternDataSource(item.id, item.title);
    }
    createAll(items: PatternDataSource[]): PatternDataSource[] {
        if(!items){
            throw new Error('Cannot create data source from null or undefined');
        };
        return items.map(item => this.create(item));
    }
}