/*
 * Wazuh app - React component for showing the Mitre Att&ck resource items.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TableWzAPI } from '../../../components/common/tables';
import { WzRequest } from '../../../react-services';
import { ModuleMitreAttackIntelligenceFlyout } from './resource_detail_flyout';

export const ModuleMitreAttackIntelligenceResource = ({
  label,
  searchBarSuggestions,
  apiEndpoint,
  tableColumnsCreator,
  initialSortingField,
  resourceFilters
}) => {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.href);
    const redirectTab = urlParams.get('tabRedirect');
    const idToRedirect = urlParams.get("idToRedirect");
    if(redirectTab && idToRedirect){
      const endpoint = `/mitre/${redirectTab}?q=references.external_id=${idToRedirect}`;
      getMitreItemToRedirect(endpoint);
      urlParams.delete('tabRedirect');
      urlParams.delete('idToRedirect');
      window.history.pushState({},document.title,'#/overview/?tab=mitre')
    }
  },[]);


  const getMitreItemToRedirect = async (endpoint) => {
    try {
      const res = await WzRequest.apiReq("GET", endpoint, {});
      const data = res?.data?.data.affected_items.map((item) => ({
        ...item,
        ["references.external_id"]: item?.references?.find(
          (reference) => reference.source === "mitre-attack"
        )?.external_id,
      }));
      setDetails(data[0]); 
    } catch {
      return {};
    }
  };
  
  const tableColumns = useMemo(() => tableColumnsCreator(setDetails), []);

  const closeFlyout = useCallback(() => {
    setDetails(null);
  },[]);

  return (
    <>
      <TableWzAPI
        searchTable
        title={label}
        tableColumns={tableColumns}
        tableInitialSortingField={initialSortingField}
        searchBarPlaceholder={`Search in ${label}`}
        searchBarSuggestions={searchBarSuggestions}
        endpoint={apiEndpoint}
        tablePageSizeOptions={[10]}
        mapResponseItem={(item) => ({...item, ['references.external_id']: item?.references?.find(reference => reference.source === 'mitre-attack')?.external_id})}
        filters={resourceFilters}
      />
      {details && (
        <ModuleMitreAttackIntelligenceFlyout
          details={details}
          closeFlyout={() => closeFlyout()}
          onSelectResource={setDetails}
        />
      )}
    </> 
  )
};
