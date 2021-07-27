import { useState, useEffect } from 'react';
import { getDataPlugin } from '../../../kibana-services';
import { useQuery, useIndexPattern, useFilterManager } from '.';
import _ from 'lodash';
import { Filter, IndexPattern } from 'src/plugins/data/public';

/*
You can find more info on how to use the preAppliedAggs object at https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-terms-aggregation.html
You can find more info on how to construct a filter object at https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
*/
const useEsSearch = ({ preAppliedFilters = [], preAppliedAggs = {}, size = 10 }) => {
  const data = getDataPlugin();
  const indexPattern = useIndexPattern();
  const filterManager = useFilterManager();
  const [esResults, setEsResults] = useState({});
  const [managedFilters, setManagedFilters] = useState<Filter[] | []>([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [query] = useQuery();
  useEffect(() => {
    setIsLoading(true);
    search()
      .then((result) => {
        setEsResults(result);
        setError(null);
      })
      .catch((error)=>{
        setError(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
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

  const search = async () => {
    if (indexPattern) {
      const esQuery = await data.query.getEsQuery(indexPattern as IndexPattern);
      const searchSource = await data.search.searchSource.create();
      const combined = [...esQuery.bool.filter, ...preAppliedFilters, ...managedFilters];
      const results = await searchSource
        .setParent(undefined)
        .setField('filter', combined)
        .setField('query', query)
        .setField('aggs', preAppliedAggs)
        .setField('size', size)
        .setField('from', page * size)
        .setField('index', indexPattern as IndexPattern)
        .fetch();
      return results;
    } else {
      return {};
    }
  };

  const nextPage = () => {
    setPage(page + 1);
  };
  const prevPage = () => {
    setPage(page - 1 < 0 ? 0 : page - 1);
  };

  return {esResults, isLoading, error, setPage, nextPage, prevPage};
};

export { useEsSearch };
