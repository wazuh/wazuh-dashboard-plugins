import { useState, useEffect } from 'react';
import { getDataPlugin } from '../../../kibana-services';
import { useQuery, useIndexPattern, useFilterManager } from '../hooks';
import _ from 'lodash';

/*
You can find more info on how to use the preAppliedAggs object at https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-terms-aggregation.html
You can find more info on how to construct a filter object at https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html
*/
const useEsSearch = ({ preAppliedFilters = [], preAppliedAggs = {}, size = 10 }) => {
  const data = getDataPlugin();
  const indexPattern = useIndexPattern();
  const filterManager = useFilterManager();
  const [esResults, setEsResults] = useState({});
  const [managedFilters, setManagedFilters] = useState([]);
  const [page, setPage] = useState(0);
  const [query] = useQuery();
  useEffect(() => {
    search().then((result) => {
      setEsResults(result);
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
  });

  const search = async () => {
    if (indexPattern) {
      const esQuery = await data.query.getEsQuery(indexPattern);
      const searchSource = await data.search.searchSource.create();
      const combined = [...esQuery.bool.filter, ...preAppliedFilters, ...managedFilters];
      const results = await searchSource
        .setParent(undefined)
        .setField('filter', combined)
        .setField('query', esQuery)
        .setField('aggs', preAppliedAggs)
        .setField('size', size)
        .setField('from', page * size)
        .setField('index', indexPattern)
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

  return {
    esResults,
    setPage,
    nextPage,
    prevPage,
  };
};

export { useEsSearch };
