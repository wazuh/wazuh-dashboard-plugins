import React, { useState } from 'react';
import {
  EuiPageHeader,
  EuiLink,
  EuiButton,
  EuiHealth,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSearchBar,
  EuiCallOut,
  EuiText,
} from '@elastic/eui';
import './integrations.scss';
import { CardIntegration } from './components/card-integration';

const integrations = [
  {
    image: 'advancedSettingsApp',
    title: 'Integration 1',
    description: 'Description for integration 1',
    isEnable: true,
  },
  {
    image: 'grokApp',
    title: 'Integration 2',
    description: 'Description for integration 2',
    isEnable: false,
  },
  {
    image: 'grokApp',
    title: 'Integration 3',
    description: 'Description for integration 3',
    isEnable: true,
  },
  {
    image: 'reportingApp',
    title: 'Integration 4',
    description: 'Description for integration 4',
    isEnable: false,
  },
  {
    image: 'heartbeatApp',
    title: 'Integration 5',
    description: 'Description for integration 5',
    isEnable: true,
  },
  {
    image: 'appSearchApp',
    title: 'Integration 6',
    description: 'Description for integration 6',
    isEnable: false,
  },
  {
    image: 'indexRollupApp',
    title: 'Integration 7',
    description: 'Description for integration 7',
    isEnable: true,
  },
  {
    image: 'canvasApp',
    title: 'Integration 8',
    description: 'Description for integration 8',
    isEnable: false,
  },
  {
    image: 'securityApp',
    title: 'Integration 9',
    description: 'Description for integration 9',
    isEnable: true,
  },
  {
    image: 'lensApp',
    title: 'Integration 10',
    description: 'Description for integration 10',
    isEnable: false,
  },
];

export const IntegrationOverview = () => {
  const [lastUpdate, setLastUpdate] = useState({
    lastUpdateDate: '12/18/2024',
    status: 'Success',
  });
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

  // Search bar

  const initialQuery = EuiSearchBar.Query.MATCH_ALL;
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState(null);

  const onChange = ({ query, error }) => {
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

  const renderError = () => {
    if (!error) {
      return;
    }

    return (
      <>
        <EuiCallOut
          iconType='faceSad'
          color='danger'
          title={`Invalid search: ${error.message}`}
        />
      </>
    );
  };

  return (
    <>
      <EuiPageHeader
        pageTitle={titleHeader}
        description={
          <>
            Last update of the content manager was {lastUpdate.lastUpdateDate} (
            {lastUpdate.status}).{' '}
            <EuiLink href='link-documentation' target='_blank'>
              Learn more
            </EuiLink>
          </>
        }
        rightSideItems={[
          <EuiButton
            key={`${lastUpdate.lastUpdateDate}-${lastUpdate.status}`}
            fill
            onClick={updateContentManager}
          >
            Update
          </EuiButton>,
        ]}
      />
      <div style={{ margin: '20px 0' }}>
        <EuiSearchBar
          defaultQuery={initialQuery}
          box={{
            placeholder: 'Search...',
            schema,
          }}
          filters={filters}
          onChange={onChange}
        />
      </div>
      {renderError()}
      <EuiFlexGroup gutterSize='m' wrap>
        {query.text === ''
          ? integrations.map((integration, index) => (
              <EuiFlexItem key={index}>
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
                <EuiFlexItem key={index}>
                  <CardIntegration {...integration} />
                </EuiFlexItem>
              ))}
      </EuiFlexGroup>
    </>
  );
};
