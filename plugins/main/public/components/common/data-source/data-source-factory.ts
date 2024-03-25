import { tDataSource, tParsedIndexPattern } from './index';

export interface IDataSourceFactoryConstructor<T extends tDataSource> {
    new (id: T['id'], title: T['title']): T;
}

export type tDataSourceFactory<T extends object,K extends tDataSource> = {
    create: (DataSourceType: IDataSourceFactoryConstructor<K>, data: T) => Promise<K>;
    createAll: (DataSourceType: IDataSourceFactoryConstructor<K>, data: T[]) => Promise<K[]>;
}