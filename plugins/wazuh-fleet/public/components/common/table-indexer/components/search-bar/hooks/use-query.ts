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
import { useState, useEffect } from 'react';
import { getPlugins } from '../../../../../../plugin-services';

export const useQueryManager = () => {
  const [query, setQuery] = useState(
    getPlugins().data.query.queryString.getQuery(),
  );

  useEffect(() => {
    const subscriber = getPlugins()
      .data.query.queryString.getUpdates$()
      .subscribe(q => {
        setQuery(q);
      });

    return () => subscriber.unsubscribe();
  }, []);

  return [query, getPlugins().data.query.queryString.setQuery];
};
