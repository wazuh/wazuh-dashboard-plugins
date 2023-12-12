import { getPlugins } from '../../../../kibana-services';
import { IndexPattern, Filter, OpenSearchQuerySortValue } from "../../../../../../../src/plugins/data/public";
import { SearchResponse } from "../../../../../../../src/core/server";

export interface SearchParams {
    indexPattern: IndexPattern;
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
}

export const search = async (params: SearchParams): Promise<SearchResponse | void> => {
    const { indexPattern, filters = [], query, pagination, sorting, fields } = params;
    if(!indexPattern){
        return;
    }
    const data = getPlugins().data;
    const searchSource = await data.search.searchSource.create();
    const fromField = (pagination?.pageIndex || 0) * (pagination?.pageSize || 100);
    const sortOrder: OpenSearchQuerySortValue[] = sorting?.columns.map((column) => {
        const sortDirection = column.direction === 'asc' ? 'asc' : 'desc';
        return { [column?.id || '']: sortDirection } as OpenSearchQuerySortValue;
    }) || [];

    const searchParams = searchSource
        .setParent(undefined)
        .setField('filter', filters)
        .setField('query', query)
        .setField('sort', sortOrder)
        .setField('size', pagination?.pageSize)
        .setField('from', fromField)
        .setField('index', indexPattern)

    // add fields
    if (fields && Array.isArray(fields) && fields.length > 0){
        searchParams.setField('fields', fields);
    }
    try{
        return await searchParams.fetch();
    }catch(error){
        if(error.body){
            throw error.body;
        }
        throw error;
    }
};