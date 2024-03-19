export type tDataSourceFactory<T,K> = {
    create(item: T): Promise<K> | K;
    createAll(items: T[]): Promise<K[]> | K[];
}