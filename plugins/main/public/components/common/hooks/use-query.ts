/*
 * Wazuh app - React hook for get query of plugin platform searchBar
 * Copyright (C) 2015-2022 Wazuh, Inc.
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

export const useQueryManager = () => {
  const [query, setQuery] = useState(getDataPlugin().query.queryString.getQuery());
  useEffect(() => {
    const subscriber = getDataPlugin().query.queryString.getUpdates$().subscribe((q) => {
      setQuery(q);
    });
    return () => subscriber.unsubscribe();
  },[]);
  return [query, getDataPlugin().query.queryString.setQuery];
}
