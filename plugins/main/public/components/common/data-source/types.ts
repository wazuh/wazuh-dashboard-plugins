import { Filter } from "../../../../../../src/plugins/data/common";
import { FilterManager } from "../../../../../../src/plugins/data/public";

export type tSearchParams = {
    filters?: Filter[];
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
    aggs?: any;
}

export type tFilter = Filter;

// create a new type using the FilterManager type but only the getFilters, setFilters, addFilters, getUpdates$
export type tFilterManager = Pick<FilterManager, 'getFilters' | 'setFilters' | 'addFilters' | 'getUpdates$'>;

export type tDataSource = {
    id: string;
    title: string;
    select(): Promise<void>;
    getFields(): any[];
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
    setDefault(dataSourceData: T): void;
    getDefault(): Promise<T | null>;
}


export type tDataSourceSelector<T extends tDataSource> = {
    existsDataSource: (id: string) => Promise<boolean>;
    getFirstValidDataSource: () => Promise<T>;
    getAllDataSources: () => Promise<T[]>;
    getDataSource: (id: string) => Promise<T>;
    getSelectedDataSource: () => Promise<T>;
    selectDataSource: (id: string) => Promise<void>;
}
