import { useState, useEffect } from 'react';
import { getDataPlugin } from '../../../kibana-services';
import { useQuery, useIndexPattern } from '../hooks';
import { AppState } from '../../../react-services/app-state';
import _ from 'lodash';

const useEsSearch = (preAppliedQuery = {}, preAppliedAggs = {}, size = 10) => {
  const data = getDataPlugin();
  const indexPattern = useIndexPattern();
  const [query] = useQuery();
  const [esQuery, setEsQuery] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchResults, setSearchResults] = useState({});

  useEffect(() => {
    getEsQuery().then((result) => {
      if (!_.isEqual(result, query)) {
        setEsQuery(result);
      }
    });
  }, [query]);
  const getEsQuery = async () => {
    const esQuery = await data.query.getEsQuery(indexPattern);
    return esQuery;
  };

  //useEffect(() => {
  //  setIsLoading(true);
  //  search()
  //    .then((result) => {
  //      if(!_.isEqual(result,searchResults)){
  //        setSearchResults(result);
  //      }
  //    })
  //    .finally(() => {
  //      setIsLoading(false);
  //    });
  //}, [esQuery, preAppliedQuery, preAppliedAggs, size, indexPattern]);
  const search = async () => {
    console.log("SEARCHING")
    if (indexPattern) {
      const searchSource = await data.search.searchSource.create();
      const combined = _.merge({ ...preAppliedQuery }, { ...esQuery } || {});
      const results = searchSource
        .setParent(undefined)
        .setField('query', combined)
        .setField('aggs', preAppliedAggs)
        .setField('size', size)
        .setField('index', indexPattern)
        .fetch();
      return results;
    } else {
      return {};
    }
  };
  return {
    searchResults,
    isLoading,
    search,
  };
};

export { useEsSearch };
