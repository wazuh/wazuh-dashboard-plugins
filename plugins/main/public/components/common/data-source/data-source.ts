import { tFilter, tSearchParams } from './search-params-builder';

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
}