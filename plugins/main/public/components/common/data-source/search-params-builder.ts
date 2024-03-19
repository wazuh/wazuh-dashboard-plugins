import { Filter } from "../../../../../../src/plugins/data/common";

export type tFilter = Filter;

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

export class SearchParamsBuilder {
    private searchParams: tSearchParams;

    constructor() {
        this.searchParams = {};
    }

    addFilters(filters: tFilter[]): SearchParamsBuilder {
        this.searchParams.filters = filters;
        return this;
    }

    addQuery(query: any): SearchParamsBuilder {
        this.searchParams.query = query;
        return this;
    }

    addPagination(pageIndex: number, pageSize: number): SearchParamsBuilder {
        this.searchParams.pagination = { pageIndex, pageSize };
        return this;
    }

    addFields(fields: string[]): SearchParamsBuilder {
        this.searchParams.fields = fields;
        return this;
    }

    addSorting(columns: { id: string, direction: 'asc' | 'desc' }[]): SearchParamsBuilder {
        this.searchParams.sorting = { columns };
        return this;
    }

    addDateRange(from: string, to: string): SearchParamsBuilder {
        this.searchParams.dateRange = { from, to };
        return this;
    }

    build(): tSearchParams {
        return this.searchParams;
    }
}