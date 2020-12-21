/*
 * Wazuh app - React hook for get Kibana time filter
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { useEffect, useState } from 'react';
import { getDataPlugin } from '../../../kibana-services';

export function useTimeFilter() {
  const _timeFilter = getDataPlugin().query.timefilter.timefilter();
  const [timeFilter, setTimeFilter] = useState(_timeFilter.getTime());
  const [timeHistory, setTimeHistory] = useState(_timeFilter._history);
  useEffect(() => {
    const subscription = _timeFilter.getTimeUpdate$().subscribe(() => {
      setTimeFilter(_timeFilter.getTime());
      setTimeHistory(_timeFilter._history);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return { timeFilter, setTimeFilter: _timeFilter.setTime, timeHistory };
}
