import { SearchResponse } from "../../../../../../../../src/core/server";
import { getPlugins } from '../../../../../kibana-services';
import { IndexPattern, Filter, OpenSearchQuerySortValue } from "../../../../../../../../src/plugins/data/public";
import * as FileSaver from '../../../../../services/file-saver';
import { beautifyDate } from "../../../../agents/vuls/inventory/lib";


interface SearchParams {
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


export const search = async (params: SearchParams): Promise<SearchResponse> => {
    const { indexPattern, filters = [], query, pagination, sorting, fields } = params;
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
    if (fields && Array.isArray(fields) && fields.length > 0)
        searchParams.setField('fields', fields);


    return await searchParams.fetch();
};


export const parseData = (resultsHits: SearchResponse['hits']['hits']): any[] => {
    const data = resultsHits.map((hit) => {
        if (!hit) {
            return {}
        }
        const source = hit._source as object;
        const data = {
            ...source,
            _id: hit._id,
            _index: hit._index,
            _type: hit._type,
            _score: hit._score,
        };
        return data;
    });
    return data;
}


export const getFieldFormatted = (rowIndex, columnId, indexPattern, rowsParsed) => {
    const field = indexPattern.fields.find((field) => field.name === columnId);
    let fieldValue = null;
    if (columnId.includes('.')) {
        // when the column is a nested field. The column could have 2 to n levels
        // get dinamically the value of the nested field
        const nestedFields = columnId.split('.');
        fieldValue = rowsParsed[rowIndex];
        nestedFields.forEach((field) => {
            if (fieldValue) {
                fieldValue = fieldValue[field];
            }
        });

    } else {
        fieldValue = rowsParsed[rowIndex][columnId].formatted
            ? rowsParsed[rowIndex][columnId].formatted
            : rowsParsed[rowIndex][columnId];
    }

    // if is date field
    if (field?.type === 'date') {
        // @ts-ignore
        fieldValue = beautifyDate(fieldValue);
    }
    return fieldValue;
}

export const exportSearchToCSV = async (params: SearchParams): Promise<void> => {
    const { indexPattern, filters = [], query, sorting, fields } = params;
    const searchResults = await search(params);
    const resultsFields = fields;
    const data = searchResults.hits.hits.map((hit) => { 
        // check if the field type is a date
        const dateFields = indexPattern.fields.getByType('date');
        const dateFieldsNames = dateFields.map((field) => field.name);
        const flattenHit = indexPattern.flattenHit(hit);
        // replace the date fields with the formatted date
        dateFieldsNames.forEach((field) => {
            if (flattenHit[field]) {
                flattenHit[field] = beautifyDate(flattenHit[field]);
            }
        });
        return flattenHit;
    });

    if (!resultsFields || resultsFields.length === 0){
        return;
    }

    if (!data || data.length === 0)
        return;

    const parsedData = data.map((row) => {
        const parsedRow = resultsFields?.map((field) => {
            const value = row[field];
            if (value === undefined || value === null) {
                return '';
            }
            if (typeof value === 'object') {
                return JSON.stringify(value);
            }
            return `"${value}"`;
        });
        return parsedRow?.join(',');
    }).join('\n');



    // create a csv file using blob
    const blobData = new Blob(
        [
            `${resultsFields?.join(',')}\n${parsedData}`
        ],
        { type: 'text/csv' }
    );

    if (blobData) {
        FileSaver?.saveAs(blobData, 'vulnerabilities_inventory.csv');
    }
}