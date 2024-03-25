export type tDataSourceRepository<T extends object> = {
    get(id: string): Promise<T>;
    getAll(): Promise<T[]>;
    setDefault(dataSourceData: T): Promise<void> | void;
    getDefault(): Promise<T | null> | T | null;
}