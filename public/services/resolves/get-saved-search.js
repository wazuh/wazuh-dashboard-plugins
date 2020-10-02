/*
 * Wazuh app - Module to check discover
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { healthCheck } from './health-check';
import { recentlyAccessed } from '../../../../../src/core/public/chrome/recently_accessed';
import { createSavedSearchesLoader } from '../../../../../src/plugins/discover/public';
import { npStart } from 'ui/new_platform';
import {
  redirectWhenMissing,
} from '../../../../../src/plugins/discover/public/kibana_services';

export function getSavedSearch(
  $location,
  $window,
  $route
) {
  const services = {
    savedObjectsClient: npStart.core.savedObjects.client,
    indexPatterns: npStart.plugins.data.indexPatterns,
    search: npStart.plugins.data.search,
    chrome: npStart.core.chrome,
    overlays: npStart.core.overlays,
  };

  const savedSearches = createSavedSearchesLoader(services);
  const currentParams = $location.search();
  const targetedAgent =
    currentParams && (currentParams.agent || currentParams.agent === '000');
  const targetedRule =
    currentParams && currentParams.tab === 'ruleset' && currentParams.ruleid;
  if (!targetedAgent && !targetedRule && healthCheck($window)) {
    $location.path('/health-check');
    return Promise.reject();
  } else {
    const savedSearchId = $route.current.params.id;
    return savedSearches
      .get(savedSearchId)
      .then(savedSearch => {
        if (savedSearchId) {
          recentlyAccessed.add(
            savedSearch.getFullPath(),
            savedSearch.title,
            savedSearchId
          );
        }
        return savedSearch;
      })
      .catch(
        redirectWhenMissing({
          search: '/discover',
          'index-pattern':
            '/management/kibana/objects/savedSearches/' +
            $route.current.params.id
        })
      )
  }
}
