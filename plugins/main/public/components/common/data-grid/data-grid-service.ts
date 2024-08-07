import { SearchResponse } from '../../../../../../src/core/server';
import * as FileSaver from '../../../services/file-saver';
import { beautifyDate } from '../../agents/vuls/inventory/lib';
import { SearchParams, search } from '../search-bar/search-bar-service';
import { IFieldType } from '../../../../../../src/plugins/data/common';
export const MAX_ENTRIES_PER_QUERY = 10000;
import { EuiDataGridColumn } from '@elastic/eui';
import { tDataGridColumn } from './use-data-grid';

export const parseData = (
  resultsHits: SearchResponse['hits']['hits'],
): any[] => {
  const data = resultsHits.map(hit => {
    if (!hit) {
      return {};
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
};

export const getFieldFormatted = (
  rowIndex,
  columnId,
  indexPattern,
  rowsParsed,
) => {
  const field = indexPattern.fields.find(field => field.name === columnId);
  let fieldValue = null;
  if (columnId.includes('.')) {
    // when the column is a nested field. The column could have 2 to n levels
    // get dinamically the value of the nested field
    const nestedFields = columnId.split('.');
    fieldValue = rowsParsed[rowIndex];
    nestedFields.forEach(field => {
      if (fieldValue) {
        fieldValue = fieldValue[field];
      }
    });
  } else {
    const rowValue = rowsParsed[rowIndex];
    // when not exist the column in the row value then the value is null
    if (!rowValue.hasOwnProperty(columnId)) {
      fieldValue = null;
    } else {
      fieldValue = rowValue[columnId]?.formatted || rowValue[columnId];
    }
  }
  // when fieldValue is null or undefined then return a empty string
  if (fieldValue === null || fieldValue === undefined) {
    return '';
  }
  // if is date field
  if (field?.type === 'date') {
    // @ts-ignore
    fieldValue = beautifyDate(fieldValue);
  }

  // if is geo_point field then convert to string to appear in the Discover table
  if (field?.type === 'geo_point') {
    // @ts-ignore
    fieldValue = JSON.stringify(fieldValue);
  }
  return fieldValue;
};

// receive search params
export const exportSearchToCSV = async (
  params: SearchParams,
): Promise<void> => {
  const DEFAULT_MAX_SIZE_PER_CALL = 1000;
  const {
    indexPattern,
    filters = [],
    query,
    sorting,
    fields,
    pagination,
    filePrefix = 'events',
  } = params;
  // when the pageSize is greater than the default max size per call (10000)
  // then we need to paginate the search
  const mustPaginateSearch =
    pagination?.pageSize && pagination?.pageSize > DEFAULT_MAX_SIZE_PER_CALL;
  const pageSize = mustPaginateSearch
    ? DEFAULT_MAX_SIZE_PER_CALL
    : pagination?.pageSize;
  const totalHits = pagination?.pageSize || DEFAULT_MAX_SIZE_PER_CALL;
  let pageIndex = params.pagination?.pageIndex || 0;
  let hitsCount = 0;
  let allHits = [];
  let searchResults;
  if (mustPaginateSearch) {
    // paginate the search
    while (hitsCount < totalHits && hitsCount < MAX_ENTRIES_PER_QUERY) {
      const searchParams = {
        indexPattern,
        filters,
        query,
        pagination: {
          pageIndex,
          pageSize,
        },
        sorting,
        fields,
      };
      searchResults = await search(searchParams);
      allHits = allHits.concat(searchResults.hits.hits);
      hitsCount = allHits.length;
      pageIndex++;
    }
  } else {
    searchResults = await search(params);
    allHits = searchResults.hits.hits;
  }

  const resultsFields = fields;
  const data = allHits.map(hit => {
    // check if the field type is a date
    const dateFields = indexPattern.fields.getByType('date');
    const dateFieldsNames = dateFields.map(field => field.name);
    const flattenHit = indexPattern.flattenHit(hit);
    // replace the date fields with the formatted date
    dateFieldsNames.forEach(field => {
      if (flattenHit[field]) {
        flattenHit[field] = beautifyDate(flattenHit[field]);
      }
    });
    return flattenHit;
  });

  if (!resultsFields || resultsFields.length === 0) {
    return;
  }

  if (!data || data.length === 0) return;

  const parsedData = data
    .map(row => {
      const parsedRow = resultsFields?.map(field => {
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
    })
    .join('\n');

  // create a csv file using blob
  const blobData = new Blob([`${resultsFields?.join(',')}\n${parsedData}`], {
    type: 'text/csv',
  });

  if (blobData) {
    // @ts-ignore
    FileSaver?.saveAs(
      blobData,
      `${filePrefix}-${new Date().toISOString()}.csv`,
    );
  }
};

export const parseColumns = (
  fields: IFieldType[],
  defaultColumns: tDataGridColumn[] = [],
): EuiDataGridColumn[] => {
  // remove _source field becuase is a object field and is not supported
  fields = fields.filter(field => field.name !== '_source');
  // merge the properties of the field with the default columns
  const columns =
    fields.map(field => {
      const defaultColumn = defaultColumns.find(
        column => column.id === field.name,
      );
      return {
        ...field,
        id: field.name,
        name: field.name,
        schema: field.type,
        actions: {
          showHide: true,
        },
        ...defaultColumn,
      };
    }) || [];
  return columns;
};
