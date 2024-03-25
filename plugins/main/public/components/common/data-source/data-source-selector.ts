import { tDataSource } from "./index";

export type tDataSourceSelector<T extends tDataSource> = {
    existsDataSource: (id: string) => Promise<boolean>;
    getFirstValidDataSource: () => Promise<T>;
    getAllDataSources: () => Promise<T[]>;
    getDataSource: (id: string) => Promise<T>;
    getSelectedDataSource: () => Promise<T>;
    selectDataSource: (id: string) => Promise<void>;
}