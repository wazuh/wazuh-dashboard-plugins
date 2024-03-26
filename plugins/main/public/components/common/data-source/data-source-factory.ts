import { tDataSource } from './index'
export type tDataSourceFactory = {
    create(item: tDataSource): tDataSource;
    createAll(items: tDataSource[]): tDataSource[];
}