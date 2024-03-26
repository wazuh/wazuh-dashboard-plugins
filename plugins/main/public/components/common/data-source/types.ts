import { Filter } from "../../../../../../src/plugins/data/common";

export type tFilter = Filter & {
    meta?: {
        removable?: boolean;
    }
};

export type tSearchParams = {
    filters?: tFilter[];
    query?: any;
    pagination?: {
        pageIndex?: number;
        pageSize?: number;
    };
    fields?: string[],
    sorting?: {
        columns: {
            id: string;
            direction: 'asc' | 'desc';
        }[];
    };
    dateRange?: {
        from: string;
        to: string;
    };
}

export type tDataSource = {
    id: string;
    title: string;
    select(): Promise<void>;
    getFilters: () => Promise<tFilter[]> | tFilter[];
    setFilters: (filters: tFilter[]) => Promise<void> | void;
    getFields: () => Promise<any[]> | any[];
    getFixedFilters: () => tFilter[];
    getFetchFilters: () => tFilter[];
    fetch: (params: tSearchParams) => Promise<any>;
    toJSON(): object;
}

export interface IDataSourceFactoryConstructor<T extends tDataSource> {
    new(id: T['id'], title: T['title']): T;
}

export type tDataSourceFactory<T extends object, K extends tDataSource> = {
    create: (DataSourceType: IDataSourceFactoryConstructor<K>, data: T) => Promise<K>;
    createAll: (DataSourceType: IDataSourceFactoryConstructor<K>, data: T[]) => Promise<K[]>;
}

export type tDataSourceFilterManager = {
    fetch: () => Promise<any>;
    setFilters: (filters: tFilter[]) => void;
    getFilters: () => tFilter[];
    getFixedFilters: () => tFilter[];
    getFetchFilters: () => tFilter[];
}

export type tDataSourceRepository<T extends object> = {
    get(id: string): Promise<T>;
    getAll(): Promise<T[]>;
    setDefault(dataSourceData: T): Promise<void> | void;
    getDefault(): Promise<T | null> | T | null;
}


export type tDataSourceSelector<T extends tDataSource> = {
    existsDataSource: (id: string) => Promise<boolean>;
    getFirstValidDataSource: () => Promise<T>;
    getAllDataSources: () => Promise<T[]>;
    getDataSource: (id: string) => Promise<T>;
    getSelectedDataSource: () => Promise<T>;
    selectDataSource: (id: string) => Promise<void>;
}
