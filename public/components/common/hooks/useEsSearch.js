import { useState, useEffect } from 'react';
import { getDataPlugin } from '../../../kibana-services';
import { useQuery, useIndexPattern, useFilterManager } from '../hooks';
import _ from 'lodash';

const useEsSearch = (preAppliedQuery = {}, preAppliedAggs = {}, size = 10) => {
  const data = getDataPlugin();
  const indexPattern = useIndexPattern();
  const filterManager = useFilterManager();
  const [esResults, setEsResults] = useState({})
  useEffect(()=>{
    search()
      .then((result)=>{
        setEsResults(result)
      })
  },[indexPattern])

  const search = async () => {
    if (indexPattern) {
      const esQuery = await data.query.getEsQuery(indexPattern);
      const searchSource = await data.search.searchSource.create();
      const combined = _.merge({ ...preAppliedQuery }, { ...esQuery } || {});

      const results = await searchSource
        .setParent(undefined)
        .setField('filter', combined.bool.filter)
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
    esResults
  };
};

export { useEsSearch };
