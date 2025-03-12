import { SearchResponse } from '../../../../../../src/core/server';
import * as FileSaver from '../../../services/file-saver';
import { beautifyDate } from '../../agents/vuls/inventory/lib';
import { SearchParams, search } from '../search-bar/search-bar-service';
import {
  Filter,
  IFieldType,
  IndexPattern,
} from '../../../../../../src/plugins/data/common';
export const MAX_ENTRIES_PER_QUERY = 10000;
import { tDataGridColumn } from './use-data-grid';
import { cellFilterActions } from './cell-filter-actions';
import { onFilterCellActions } from './filter-cell-actions';

type ParseData<T> =
  | {
      source: T;
      _id: string;
      _index: string;
      _type: string;
      _score: number;
    }
  | {};

export const parseData = <T = unknown>(
  resultsHits: SearchResponse<T>['hits']['hits'],
): ParseData<T>[] => {
  const data = resultsHits.map(hit => {
    if (!hit) {
      return {};
    }
    const source = hit._source as T;
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
  rowIndex: number,
  columnId: string,
  indexPattern: IndexPattern,
  rowsParsed: ParseData[],
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
    dateRange,
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
        dateRange,
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
        // Escape double quotes and handle line breaks to prevent column misalignment
        return `"${value
          .toString()
          .replaceAll(/"/g, '""')
          .replaceAll(/\r\n/g, '\\r\\n')
          .replaceAll(/\n/g, '\\n')}"`;
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
    FileSaver?.saveAs(blobData, `events-${new Date().toISOString()}.csv`);
  }
};

const mapToDataGridColumn = (
  field: IFieldType,
  indexPattern: IndexPattern,
  rows: any[],
  pageSize: number,
  filters: Filter[],
  setFilters: (filters: Filter[]) => void,
  defaultColumns: tDataGridColumn[],
): tDataGridColumn => {
  const defaultColumn = defaultColumns.find(column => column.id === field.name);
  return {
    ...field,
    id: field.name,
    name: field.name,
    schema: field.type,
    actions: { showHide: true },
    ...defaultColumn,
    cellActions: cellFilterActions(
      field,
      indexPattern,
      rows,
      pageSize,
      onFilterCellActions(indexPattern.id as string, filters, setFilters),
    ),
  } as tDataGridColumn;
};

export const parseColumns = (
  fields: IFieldType[],
  defaultColumns: tDataGridColumn[] = [],
  indexPattern: IndexPattern,
  rows: any[],
  pageSize: number,
  filters: Filter[],
  setFilters: (filters: Filter[]) => void,
): tDataGridColumn[] => {
  // remove _source field becuase is a object field and is not supported
  // merge the properties of the field with the default columns
  if (!fields?.length) return defaultColumns;

  return fields
    .filter(field => field.name !== '_source')
    .map(field =>
      mapToDataGridColumn(
        field,
        indexPattern,
        rows,
        pageSize,
        filters,
        setFilters,
        defaultColumns,
      ),
    );
};

/**
 * Merge the defaults columns and the wzDiscoverRenderColumns
 * The custom columns renders will override the defaults columns.
 * Only consider the fields that have the render method
 * @param customColumns
 * @param defaultColumns
 */
export const getAllCustomRenders = (
  customColumns: tDataGridColumn[],
  discoverColumns: tDataGridColumn[],
): tDataGridColumn[] => {
  const customColumnsWithRender = customColumns.filter(column => column.render);
  const allColumns = discoverColumns.map(column => {
    const customColumn = customColumnsWithRender.find(
      customColumn => customColumn.id === column.id,
    );
    return customColumn || column;
  });
  return allColumns;
};
