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
import { createSavedSearchesLoader } from '../../../../../src/plugins/discover/public';
import { getToasts, getChrome, getOverlays, getDataPlugin, getSavedObjects } from '../../kibana-services';

export function getSavedSearch(
  $location,
  $window,
  $route
) {
  const services = {
    savedObjectsClient: getSavedObjects().client,
    indexPatterns: getDataPlugin().indexPatterns,
    search: getDataPlugin().search,
    chrome: getChrome(),
    overlays: getOverlays(),
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
          getChrome().recentlyAccessed.add(
            savedSearch.getFullPath(),
            savedSearch.title,
            savedSearchId
          );
        }
        return savedSearch;
      })
      .catch(() => {
        getToasts().addWarning({
          title: 'Saved object is missing',
          text: (element) => {
            ReactDOM.render(<ErrorRenderer>{error.message}</ErrorRenderer>, element);
            return () => ReactDOM.unmountComponentAtNode(element);
          },
        });

        /* redirectWhenMissing({
          search: '/discover',
          'index-pattern':
            '/management/kibana/objects/savedSearches/' +
            $route.current.params.id
        }) */
      });
  }
}
