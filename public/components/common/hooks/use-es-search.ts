import { SetStateAction, useEffect, useState } from 'react';
import { getDataPlugin } from '../../../kibana-services';
import { useFilterManager, useIndexPattern, useQuery } from '.';
import _ from 'lodash';
import { Filter, IndexPattern } from 'src/plugins/data/public';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { Dispatch } from 'x-pack/node_modules/@types/react';

/*
You can find more info on how to use the preAppliedAggs object at
 https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-terms-aggregation.html
You can find more info on how to construct a filter object at https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
*/

interface IEsResults {
  aggregations: { buckets: [buckets: any] };
}
interface IUseEsSearch {
  esResults: IEsResults;
  isLoading: boolean;
  error: Error | undefined;
  setPage: Dispatch<SetStateAction<number>>;
  nextPage: () => void;
  prevPage: () => void;
}

const useEsSearch = ({ preAppliedFilters = [], preAppliedAggs = {}, size = 10 }): IUseEsSearch => {
  const data = getDataPlugin();
  const indexPattern = useIndexPattern();
  const filterManager = useFilterManager();
  const [query] = useQuery();
  const [esResults, setEsResults] = useState<IEsResults>({
    aggregations: { buckets: [{}] },
  });
  const [managedFilters, setManagedFilters] = useState<Filter[] | []>([]);
  const [error, setError] = useState<Error>();
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
  }, [indexPattern, query, managedFilters, page]);

  useEffect(() => {
    let filterSubscriber = filterManager.getUpdates$().subscribe(() => {
      const newFilters = filterManager.getFilters();
      if (!_.isEqual(managedFilters, newFilters)) {
        setManagedFilters(newFilters);
      }
      return () => {
        filterSubscriber.unsubscribe();
      };
    });
  }, []);

  const search = async (): Promise<IEsResults> => {
    if (indexPattern) {
      const esQuery = await data.query.getEsQuery(indexPattern as IndexPattern);
      const searchSource = await data.search.searchSource.create();
      const combined = [...esQuery.bool.filter, ...preAppliedFilters, ...managedFilters];
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
      return { aggregations: { buckets: [null] } };
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
