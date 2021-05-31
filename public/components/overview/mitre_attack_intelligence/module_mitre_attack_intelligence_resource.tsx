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

import React, { useCallback, useState } from 'react';
import { TableWzAPI } from '../../../components/common/tables';

export const ModuleMitreAttackIntelligenceResource = ({ label, searchBarSuggestions, apiEndpoint, tableColumns, detailsProperties, initialSortingField = 'name' }) => {
  const [filters, setFilters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [details, setDetails] = useState(null);

  const rowProps = useCallback((item) => ({
    // 'data-test-subj': `row-${file}`,
    onClick: () => {
      setDetails(item);
      setIsDetailsOpen(true);
    },
  }), []);

  const closeFlyout = useCallback(() => {
    setDetails(null);
    setIsDetailsOpen(false);
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
        tableProps={{rowProps}}
        tablePageSizeOptions={[10]}
      />
      {/* {details && isDetailsOpen && (
        <EuiOverlayMask
          headerZindexLocation="below"
          onClick={closeFlyout} >
          <EuiFlyout
            onClose={closeFlyout}
            size="l"
            aria-labelledby={``}
            // maxWidth="70%"
            // className=""
          >
            <EuiFlyoutHeader hasBorder>
              <EuiTitle size="m">
                <h2 id="flyoutTitle">Details</h2>
              </EuiTitle>
            </EuiFlyoutHeader>
            <EuiFlyoutBody>
              <EuiFlexGroup>
                {detailsProperties.map(detailProperty => (
                  <EuiFlexItem grow={false} key={`module_mitre_ingelligense_resource_detail_property_${detailProperty.id}`}>
                    <div><strong>{detailProperty.label}</strong></div>
                    <EuiText color='subdued'>{details[detailProperty.id]}</EuiText>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <div><strong>Description</strong></div>
                  <EuiText color='subdued'>{details.description}</EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiAccordion
                    style={{ textDecoration: 'none' }}
                    id=''
                    className='events-accordion'
                    // extraAction={<div style={{ marginBottom: 5 }}><strong>{this.state.totalHits || 0}</strong> hits</div>}
                    buttonContent='Techniques'
                    paddingSize='none'
                    initialIsOpen={true}>
                      <EuiBasicTable 
                        items={details.techniques.map(technique => ({technique}))}
                        columns={[{field: 'technique', name: 'Technique'}]}
                      />
                  </EuiAccordion>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlyoutBody>
          </EuiFlyout>
        </EuiOverlayMask>
      )
      } */}
    </> 
  )
}