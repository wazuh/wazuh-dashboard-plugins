/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { useState, useEffect } from 'react';
import {
  DataPublicPluginStart,
  SavedQuery,
} from '../../../../../../../src/plugins/data/public';
import { clearStateFromSavedQuery } from './clear_saved_query';
import { populateStateFromSavedQuery } from './populate_state_from_saved_query';
import NavigationService from '../../../../react-services/navigation-service';
import { OSD_URL_STATE_STORAGE_ID } from '../../../../../common/constants';
import { getDataPlugin, getUiSettings } from '../../../../kibana-services';
import { createOsdUrlStateStorage } from '../../../../../../../src/plugins/opensearch_dashboards_utils/public';
import OsdUrlStateStorage from '../../../../react-services/state-storage';

interface UseSavedQueriesProps {
  queryService: DataPublicPluginStart['query'];
}

interface UseSavedQueriesReturn {
  savedQuery?: SavedQuery;
  setSavedQuery: (savedQuery: SavedQuery) => void;
  clearSavedQuery: () => void;
}

export const useSavedQuery = (
  props: UseSavedQueriesProps,
): UseSavedQueriesReturn => {
  // Handle saved queries
  const [savedQuery, setSavedQuery] = useState<SavedQuery | undefined>();
  const data = getDataPlugin();
  const config = getUiSettings();
  const history = NavigationService.getInstance().getHistory();
  const osdUrlStateStorage = createOsdUrlStateStorage({
    useHash: config.get(OSD_URL_STATE_STORAGE_ID),
    history: history,
  });

  const saveSavedQuery = async (savedQueryId?: string) => {
    await OsdUrlStateStorage(data, osdUrlStateStorage).replaceUrlAppState({
      savedQuery: savedQueryId,
      filters: props.queryService.filterManager.getAppFilters(),
    });
  };

  const updateSavedQuery = async (savedQuery: SavedQuery) => {
    setSavedQuery(savedQuery);
    saveSavedQuery(savedQuery.id);
    populateStateFromSavedQuery(props.queryService, savedQuery);
  };

  const clearSavedQuery = () => {
    setSavedQuery(undefined);
    // remove saved query from url
    saveSavedQuery(undefined);
    clearStateFromSavedQuery(props.queryService);
  };

  // Effect is used to convert a saved query id into an object
  useEffect(() => {
    const fetchSavedQuery = async () => {
      try {
        const savedQueryId = OsdUrlStateStorage(
          data,
          osdUrlStateStorage,
        ).getAppStateFromUrl().savedQuery as string;
        if (!savedQueryId) return;
        // fetch saved query
        const savedQuery = await props.queryService.savedQueries.getSavedQuery(
          savedQueryId,
        );
        updateSavedQuery(savedQuery);
      } catch (error) {
        clearSavedQuery();
      }
    };

    fetchSavedQuery();
  }, [props.queryService, props.queryService.savedQueries]);

  return {
    savedQuery,
    setSavedQuery: updateSavedQuery,
    clearSavedQuery,
  };
};
