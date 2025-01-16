import React, { useState } from 'react';
import {
  EuiLink,
  EuiButton,
  EuiHealth,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  Query,
} from '@elastic/eui';
import './integrations.scss';
import { SearchBar } from '../common/searchbar';
import { HeaderPage } from '../common/header-page';
import { CardIntegration } from './components/card-integration';
import { integrations } from './mock-data-integrations';

export const IntegrationOverview = () => {
  const [query, setQuery] = useState({ text: '' });
  const [error, setError] = useState(null);
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

  const descriptionHeader = (
    <>
      Last update of the content manager was {lastUpdate.lastUpdateDate} (
      {lastUpdate.status}).{' '}
      <EuiLink href='link-documentation' target='_blank'>
        Learn more
      </EuiLink>
    </>
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

  const onChange = ({ query, error }: { query: Query; error: Error }) => {
    if (error) {
      setError(error);
    } else {
      setError(null);
      setQuery(query);
    }
  };

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

  return (
    <>
      <HeaderPage
        titleHeader={titleHeader}
        descriptionHeader={descriptionHeader}
        rightSideItems={rightSideItems}
      />
      <SearchBar
        schema={schema}
        filters={filters}
        onChange={onChange}
        error={error}
      />
      <EuiFlexGroup gutterSize='m' wrap>
        {query.text === ''
          ? integrations.map((integration, index) => (
              <EuiFlexItem
                style={{
                  position: 'relative',
                  minWidth: '200px',
                  maxWidth: '250px',
                }}
                grow={1}
                key={index}
              >
                <CardIntegration {...integration} />
              </EuiFlexItem>
            ))
          : integrations
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
                    maxWidth: '250px',
                  }}
                  grow={1}
                  key={index}
                >
                  <CardIntegration {...integration} />
                </EuiFlexItem>
              ))}
      </EuiFlexGroup>
    </>
  );
};
