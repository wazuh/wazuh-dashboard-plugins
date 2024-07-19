/*
 * Wazuh app - Module to check discover
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { healthCheck } from './health-check';
import { createSavedSearchesLoader } from '../../kibana-integrations/discover/saved_searches';
import {
  getToasts,
  getChrome,
  getOverlays,
  getDataPlugin,
  getSavedObjects,
  getPlugins,
} from '../../kibana-services';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import NavigationService from '../../react-services/navigation-service';

export function getSavedSearch() {
  try {
    const services = {
      savedObjectsClient: getSavedObjects().client,
      indexPatterns: getDataPlugin().indexPatterns,
      search: getDataPlugin().search,
      chrome: getChrome(),
      overlays: getOverlays(),
      savedObjects: getPlugins().savedObjects, //for kibana ^7.11
    };

    const savedSearches = createSavedSearchesLoader(services);
    const currentParams = new URLSearchParams(
      NavigationService.getInstance().getSearch(),
    );
    const targetedAgent =
      currentParams &&
      (currentParams.get('agent') || currentParams.get('agent') === '000');
    const targetedRule =
      currentParams &&
      currentParams.get('tab') === 'ruleset' &&
      currentParams.get('ruleid');
    if (!targetedAgent && !targetedRule && healthCheck()) {
      NavigationService.getInstance().navigate({
        pathname: '/health-check',
        state: { prevLocation: NavigationService.getInstance().getLocation() },
      });
      return Promise.reject();
    } else {
      const savedSearchId = currentParams.get('id'); // = $route.current.params.id; TODO: I am not sure how to port this
      return savedSearches
        .get(savedSearchId)
        .then(savedSearch => {
          if (savedSearchId) {
            getChrome().recentlyAccessed.add(
              savedSearch.getFullPath(),
              savedSearch.title,
              savedSearchId,
            );
          }
          return savedSearch;
        })
        .catch(() => {
          getToasts().addWarning({
            title: 'Saved object is missing',
            text: element => {
              ReactDOM.render(
                <ErrorRenderer>{error.message}</ErrorRenderer>,
                element,
              );
              return () => ReactDOM.unmountComponentAtNode(element);
            },
          });
        });
    }
  } catch (error) {
    const options = {
      context: `${getSavedSearch.name}`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.BUSINESS,
      store: true,
      error: {
        error: error,
        message: error.message || error,
        title: error.name || error,
      },
    };
    getErrorOrchestrator().handleError(options);
  }
}
