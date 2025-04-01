import { SearchResponse } from 'src/core/server';
import { IFieldType, IndexPattern, Filter } from 'src/plugins/data/common';
import * as FileSaver from '../../../utils/file-saver';
import { beautifyDate } from '../../../utils/beautify-date';
import { getPlugins } from '../../../plugin-services';
import { DataGridColumn } from './use-data-grid';
import { MAX_ENTRIES_PER_QUERY } from './constants';

export interface TSearchParams {
  filters?: Filter[];
  query?: any;
  pagination?: {
    pageIndex?: number;
    pageSize?: number;
  };
  fields?: string[];
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

export type SearchParams = {
  indexPattern: IndexPattern;
  filePrefix: string;
} & TSearchParams;

const DEFAULT_PAGE_SIZE = 100;

// Para el primer error, modificamos el tipo de retorno de la función search
export const search = async (params: SearchParams): Promise<SearchResponse> => {
  const {
    indexPattern,
    filters: defaultFilters = [],
    query,
    pagination,
    sorting,
    fields,
    aggs,
  } = params;

  if (!indexPattern) {
    throw new Error('Index pattern is required');
  }

  const data = getPlugins().data;
  const searchSource = await data.search.searchSource.create();
  const paginationPageSize = pagination?.pageSize || DEFAULT_PAGE_SIZE;
  const fromField = (pagination?.pageIndex || 0) * paginationPageSize;
  // If the paginationPageSize + the offset exceeds the 10000 result limit of OpenSearch, truncates the page size
  // to avoid an exception
  const pageSize =
    paginationPageSize + fromField < MAX_ENTRIES_PER_QUERY
      ? paginationPageSize
      : MAX_ENTRIES_PER_QUERY - fromField;
  const sortOrder: OpenSearchQuerySortValue[] =
    sorting?.columns?.map(column => {
      const sortDirection = column.direction === 'asc' ? 'asc' : 'desc';

      return { [column?.id || '']: sortDirection } as OpenSearchQuerySortValue;
    }) || [];
  let filters = defaultFilters;

  // check if dateRange is defined
  if (params.dateRange && params.dateRange?.from && params.dateRange?.to) {
    const { from, to } = params.dateRange;

    filters = [
      ...filters,
      {
        // @ts-expect-error filters typo not match
        range: {
          [indexPattern.timeFieldName || 'timestamp']: {
            gte: dateMath.parse(from).toISOString(),
            /* roundUp: true is used to transform the osd dateform to a generic date format
              For instance: the "This week" date range in the date picker.
              To: now/w
              From: now/w
              Without the roundUp the to and from date will be the same and the search will return no results or error

              - src/plugins/data/common/query/timefilter/get_time.ts
            */
            lte: dateMath
              .parse(to, { roundUp: true, forceNow: getForceNow() })
              .toISOString(),
            format: 'strict_date_optional_time',
          },
        },
      },
    ];
  }

  const searchParams = searchSource
    .setParent(undefined)
    .setField('filter', filters)
    .setField('query', query)
    .setField('sort', sortOrder)
    .setField('size', pageSize)
    .setField('from', fromField)
    .setField('index', indexPattern);

  if (fields && Array.isArray(fields) && fields.length > 0) {
    searchParams.setField('fields', fields);
  }

  if (aggs) {
    searchSource.setField('aggs', aggs);
  }

  try {
    return await searchParams.fetch();
  } catch (error) {
    if (error.body) {
      throw error.body;
    }

    throw error;
  }
};

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

    for (const field of nestedFields) {
      if (fieldValue) {
        fieldValue = fieldValue[field];
      }
    }
  } else {
    const rowValue = rowsParsed[rowIndex];

    // when not exist the column in the row value then the value is null
    if (Object.prototype.hasOwnProperty.call(rowValue, columnId)) {
      fieldValue = rowValue[columnId]?.formatted || rowValue[columnId];
    } else {
      fieldValue = null;
    }
  }

  // when fieldValue is null or undefined then return a empty string
  if (fieldValue === null || fieldValue === undefined) {
    return '';
  }

  // if is date field
  if (field?.type === 'date') {
    // @ts-expect-error beautifyDate expects a string or number but fieldValue type is unknown
    fieldValue = beautifyDate(fieldValue);
  }

  // if is geo_point field then convert to string to appear in the Discover table
  if (field?.type === 'geo_point') {
    // @ts-expect-error geo_point field value type is unknown but we need to stringify it
    fieldValue = JSON.stringify(fieldValue);
  }

  return fieldValue;
};

// receive search params
export const exportSearchToCSV = async (params: any): Promise<void> => {
  const defaultMaxSizePerCall = 1000;
  const {
    indexPattern,
    filters = [],
    query,
    sorting,
    fields,
    pagination,
    filePrefix = 'events',
  } = params;
  const mustPaginateSearch =
    pagination?.pageSize && pagination?.pageSize > defaultMaxSizePerCall;
  const pageSize = mustPaginateSearch
    ? defaultMaxSizePerCall
    : pagination?.pageSize;
  const totalHits = pagination?.pageSize || defaultMaxSizePerCall;
  let pageIndex = params.pagination?.pageIndex || 0;
  let hitsCount = 0;
  let allHits = [];
  let searchResults;
  const searchPromises = [];

  if (mustPaginateSearch) {
    // paginate the search
    while (hitsCount < totalHits && hitsCount < MAX_ENTRIES_PER_QUERY) {
      // ToDo: Uncomment when the search function is ready
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

      searchPromises.push(search(searchParams));
      hitsCount += pageSize;
      pageIndex++;
    }

    const searchResults = await Promise.all(searchPromises);

    allHits = searchResults.flatMap(result => result.hits.hits);
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
    for (const field of dateFieldsNames) {
      if (flattenHit[field]) {
        flattenHit[field] = beautifyDate(flattenHit[field]);
      }
    }

    return flattenHit;
  });

  if (!resultsFields || resultsFields.length === 0) {
    return;
  }

  if (!data || data.length === 0) {
    return;
  }

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
    // @ts-expect-error FileSaver.saveAs method type definition is not properly recognized
    FileSaver?.saveAs(
      blobData,
      `${filePrefix}-${new Date().toISOString()}.csv`,
    );
  }
};

export const parseColumns = (
  fields: IFieldType[],
  defaultColumns: DataGridColumn[] = [],
): DataGridColumn[] => {
  // remove _source field becuase is a object field and is not supported
  // merge the properties of the field with the default columns
  if (!fields?.length) {
    return defaultColumns;
  }

  const columns = fields
    .filter(field => field.name !== '_source')
    .map(field => {
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
    }) as DataGridColumn[];

  return columns;
};

/**
 * Merge the defaults columns and the wzDiscoverRenderColumns
 * The custom columns renders will override the defaults columns.
 * Only consider the fields that have the render method
 * @param customColumns
 * @param defaultColumns
 */
export const getAllCustomRenders = (
  customColumns: DataGridColumn[],
  discoverColumns: DataGridColumn[],
): DataGridColumn[] => {
  const customColumnsWithRender = customColumns.filter(column => column.render);
  const allColumns = discoverColumns.map(column => {
    const customColumn = customColumnsWithRender.find(
      customColumn => customColumn.id === column.id,
    );

    return customColumn || column;
  });

  return allColumns;
};
