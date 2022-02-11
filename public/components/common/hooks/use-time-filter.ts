/*
 * Wazuh app - React hook for get plugin platform time filter
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
//@ts-ignore

export function useTimeFilter() {
  const { timefilter } = getDataPlugin().query.timefilter;
  const [timeFilter, setTimeFilter] = useState(timefilter.getTime());
  const [timeHistory, setTimeHistory] = useState(timefilter._history);
  useEffect(() => {
    const subscription = timefilter.getTimeUpdate$().subscribe(
      () => { setTimeFilter(timefilter.getTime()); setTimeHistory(timefilter._history) });
    return () => { subscription.unsubscribe(); }
  }, []);
  return { timeFilter, setTimeFilter: timefilter.setTime, timeHistory };
}
