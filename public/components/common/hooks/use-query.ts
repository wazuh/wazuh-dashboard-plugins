/*
 * Wazuh app - React hook for get query of Kibana searchBar
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { getDataPlugin } from '../../../kibana-services';
import { useState, useEffect } from 'react';
import { ModulesHelper } from '../modules/modules-helper';

export function useQuery(): [{
  language: 'kuery' | 'lucene';
  query: string;
}, ((query: any) => void)] {
  const [query, setQuery] = useState({ language: 'kuery', query: '' });
  useEffect(() => {
    let subscription;
    ModulesHelper.getDiscoverScope()
      .then(scope => {
        setQuery(scope.state.query);
        subscription = scope.$watchCollection('fetchStatus',
        () => {setQuery(scope.state.query)});
      });
    return () => { subscription && subscription(); }
  }, []);
  const updateQuery = (query) => {
    ModulesHelper.getDiscoverScope()
      .then(scope => {
        scope.state.query = query;
      })
  }
  return [ query, updateQuery ];
}

export const useQueryManager = () => {
  return useState(getDataPlugin().query.queryString.getQuery());
}
