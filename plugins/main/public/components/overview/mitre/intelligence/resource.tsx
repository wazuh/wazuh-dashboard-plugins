/*
 * Wazuh app - React component for showing the Mitre Att&ck resource items.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TableWzAPI } from '../../../../components/common/tables';
import { WzRequest } from '../../../../react-services';
import { ModuleMitreAttackIntelligenceFlyout } from './resource_detail_flyout';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import NavigationService from '../../../../react-services/navigation-service';
import { Route, Switch } from '../../../router-search';

export const ModuleMitreAttackIntelligenceResource = ({
  label,
  searchBar,
  apiEndpoint,
  tableColumnsCreator,
  initialSortingField,
  resourceFilters,
}) => {
  const [details, setDetails] = useState(null);
  const navigationService = NavigationService.getInstance();

  useEffect(() => {
    const urlParams = navigationService.getParams();
    const hasRedirectTabParam = urlParams.has('tabRedirect');
    const hasIdToRedirectParam = urlParams.has('idToRedirect');
    if (hasRedirectTabParam && hasIdToRedirectParam) {
      const redirectTab = urlParams.get('tabRedirect');
      const idToRedirect = urlParams.get('idToRedirect');
      const endpoint = `/mitre/${redirectTab}?q=external_id=${idToRedirect}`;
      getMitreItemToRedirect(endpoint);
    }
  }, [
    navigationService.getParams().has('tabRedirect'),
    navigationService.getParams().has('idToRedirect'),
  ]);

  const getMitreItemToRedirect = async endpoint => {
    try {
      const res = await WzRequest.apiReq('GET', endpoint, {});
      const data = res?.data?.data.affected_items;
      setDetails(data[0]);
    } catch (error) {
      const options = {
        context: `${ModuleMitreAttackIntelligenceResource.name}.getMitreItemToRedirect`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        display: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  };

  const tableColumns = useMemo(() => tableColumnsCreator(setDetails), []);

  const closeFlyout = useCallback(() => {
    setDetails(null);
    NavigationService.getInstance().updateAndNavigateSearchParams({
      idToRedirect: null,
    });
  }, []);

  return (
    <>
      <TableWzAPI
        searchTable
        title={label}
        tableColumns={tableColumns}
        tableInitialSortingField={initialSortingField}
        endpoint={apiEndpoint}
        tablePageSizeOptions={[10, 15, 25, 50, 100]}
        filters={resourceFilters}
        searchBarWQL={{
          options: searchBar.wql.options,
          suggestions: searchBar.wql.suggestions,
        }}
      />
      {details && (
        <Switch>
          <Route
            path='?tabRedirect=:tabRedirect&idToRedirect=:idToRedirect'
            render={() => (
              <ModuleMitreAttackIntelligenceFlyout
                details={details}
                closeFlyout={() => closeFlyout()}
                onSelectResource={setDetails}
              />
            )}
          />
        </Switch>
      )}
    </>
  );
};
