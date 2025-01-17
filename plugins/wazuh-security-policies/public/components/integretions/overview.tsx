import React, { useState } from 'react';
import {
  EuiButton,
  EuiHealth,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import './integrations.scss';
import { SearchBar } from '../common/searchbar';
import { HeaderPage } from '../common/header-page';
import { LastUpdateContentManagerText } from '../common/last-update-content-manager-text.tsx';
import { NoResultsData } from '../common/no-results';
import { CardIntegration } from './components/card-integration';
import { integrations } from './mock-data-integrations';

export const IntegrationOverview = () => {
  const [query, setQuery] = useState({ text: '' });
  const [lastUpdate, setLastUpdate] = useState({
    lastUpdateDate: '12/18/2024',
    status: 'Success',
  });
  // Header page start
  const titleHeader = (
    <span className='integration-title-header'>
      <h1>Integrations</h1>
      <EuiHealth style={{ marginLeft: '10px' }} color='success'>
        Updated
      </EuiHealth>
    </span>
  );

  const updateContentManager = () => {
    const currentDate = new Date().toLocaleString();

    setLastUpdate({
      lastUpdateDate: currentDate,
      status: 'Success',
    });
  };

  const descriptionHeader = LastUpdateContentManagerText(
    integrations[0].lastUpdate,
  );
  const rightSideItems = [
    <EuiButton
      key={`${lastUpdate.lastUpdateDate}-${lastUpdate.status}`}
      fill
      onClick={updateContentManager}
    >
      Update
    </EuiButton>,
  ];
  // Header page end
  // Search bar start
  const filters = [
    {
      type: 'field_value_selection',
      field: 'integration',
      name: 'Integrations',
      multiSelect: 'and',
      operator: 'exact',
      cache: 10000, // will cache the loaded tags for 10 sec
      options: integrations.map(integration => ({
        value: integration.title,
        view: <EuiText>{integration.title}</EuiText>,
      })),
    },
  ];
  const schema = {
    strict: true,
    fields: {
      integration: {
        type: 'string',
      },
    },
  };
  // Search bar end
  const listAllIntegrationsComponent = integrations.map(
    (integration, index) => (
      <EuiFlexItem
        style={{
          position: 'relative',
          minWidth: '200px',
        }}
        grow={1}
        key={index}
      >
        <CardIntegration {...integration} />
      </EuiFlexItem>
    ),
  );
  const integrationFilter = integrations
    .filter(integration =>
      query.text
        .toLocaleLowerCase()
        .includes(integration.title.toLocaleLowerCase()),
    )
    .map((integration, index) => (
      <EuiFlexItem
        style={{
          position: 'relative',
          minWidth: '200px',
        }}
        grow={1}
        key={index}
      >
        <CardIntegration {...integration} />
      </EuiFlexItem>
    ));

  return (
    <>
      <HeaderPage
        titleHeader={titleHeader}
        descriptionHeader={descriptionHeader}
        rightSideItems={rightSideItems}
      />
      <SearchBar schema={schema} filters={filters} setQuery={setQuery} />
      <EuiFlexGroup gutterSize='m' wrap>
        {!query.text && listAllIntegrationsComponent}
        {query.text && integrationFilter.length === 0 ? (
          <NoResultsData query={query} />
        ) : (
          integrationFilter
        )}
      </EuiFlexGroup>
    </>
  );
};
