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
import { useState, useEffect } from 'react';
import { createOsdUrlStateStorage } from '../../../../../../../../../src/plugins/opensearch_dashboards_utils/public';
import { getCore, getPlugins } from '../../../../../../plugin-services';
import { OSD_URL_STATE_STORAGE_ID } from '../../../../../../../common/constants';
import NavigationService from '../../../../../../react-services/navigation-service';

export function useTimeFilter() {
  const navigationService = NavigationService.getInstance();
  const config = getCore().uiSettings;
  const history = navigationService.getHistory();
  const osdUrlStateStorage = createOsdUrlStateStorage({
    useHash: config.get(OSD_URL_STATE_STORAGE_ID),
    history: history,
  });
  const globalStateFromUrl = osdUrlStateStorage.get('_g');
  const { timefilter } = getPlugins().data.query.timefilter;
  const [timeFilter, setTimeFilter] = useState(
    globalStateFromUrl?.time ?? timefilter.getTime(),
  );
  const [timeHistory, setTimeHistory] = useState(timefilter._history);

  useEffect(() => {
    const subscription = timefilter.getTimeUpdate$().subscribe(() => {
      setTimeFilter(timefilter.getTime());
      setTimeHistory(timefilter._history);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { timeFilter, setTimeFilter: timefilter.setTime, timeHistory };
}
