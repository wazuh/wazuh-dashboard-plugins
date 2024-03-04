import { tDataSource } from "./data-source";

export interface DataSourceRepository {
    get(id: string): Promise<tDataSource>;
    getAll(): Promise<tDataSource[]>;
    setDefault(dataSource: tDataSource): Promise<void>;
    getDefault(): Promise<tDataSource>;
}