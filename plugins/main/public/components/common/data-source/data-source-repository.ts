export interface DataSourceRepository<T,K> {
    get(id: string): Promise<T>;
    getAll(): Promise<T[]>;
    setDefault(dataSource: K): Promise<void> | void;
    getDefault(): Promise<T | null> | T | null;
}