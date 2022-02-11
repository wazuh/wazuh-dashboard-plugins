/*
 * Wazuh app - React hook for search ElasticSearch DB.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { SetStateAction, useEffect, useState } from 'react';
import { getDataPlugin } from '../../../kibana-services';
import { useFilterManager, useIndexPattern, useQueryManager, useTimeFilter } from '.';
import { IndexPattern } from 'src/plugins/data/public';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { Dispatch } from 'x-pack/node_modules/@types/react';
import { SearchResponse } from 'src/core/server';

/*
You can find more info on how to use the preAppliedAggs object at
 https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-terms-aggregation.html
You can find more info on how to construct a filter object at https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
*/

interface IUseEsSearch {
  esResults: SearchResponse;
  isLoading: boolean;
  error: Error | undefined;
  setPage: Dispatch<SetStateAction<number>>;
  nextPage: () => void;
  prevPage: () => void;
}

const useEsSearch = ({ preAppliedFilters = [], preAppliedAggs = {}, size = 10 }): IUseEsSearch => {
  const data = getDataPlugin();
  const indexPattern = useIndexPattern();
  const {filters} = useFilterManager();
  const [query] = useQueryManager();
  const { timeFilter } = useTimeFilter();
  const [esResults, setEsResults] = useState<SearchResponse>({} as SearchResponse);
  const [error, setError] = useState<Error>({} as Error);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);

  useEffect(() => {
    setIsLoading(true);
    (async function () {
      try {
        setEsResults(await search());
      } catch (error) {
        setError(error);
        const options: UIErrorLog = {
          context: `${useEsSearch.name}.search`,
          level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
          severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
          error: {
            error: error,
            message: error.message || error,
            title: error.name,
          },
        };
        getErrorOrchestrator().handleError(options);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [indexPattern, query, filters, timeFilter, page, preAppliedAggs]);

  const search = async (): Promise<SearchResponse> => {
    if (indexPattern) {
      const esQuery = await data.query.getEsQuery(indexPattern as IndexPattern);
      const searchSource = await data.search.searchSource.create();
      const combined = [...esQuery.bool.filter, ...preAppliedFilters, ...filters];

      return await searchSource
        .setParent(undefined)
        .setField('filter', combined)
        .setField('query', query)
        .setField('aggs', preAppliedAggs)
        .setField('size', size)
        .setField('from', page * size)
        .setField('index', indexPattern as IndexPattern)
        .fetch();
    } else {
      return {} as SearchResponse;
    }
  };

  const nextPage = () => {
    setPage(page + 1);
  };
  const prevPage = () => {
    setPage(page - 1 < 0 ? 0 : page - 1);
  };

  return { esResults, isLoading, error, setPage, nextPage, prevPage };
};

export { useEsSearch };
