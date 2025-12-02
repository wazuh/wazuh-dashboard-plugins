import React, { useEffect, useState } from 'react';
import {
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexGrid,
  EuiFlexItem,
  EuiTabbedContent,
  EuiText,
  EuiProgress,
  EuiSearchBar,
  EuiSpacer,
} from '@elastic/eui';
import { compose } from 'redux';
import { i18n } from '@osd/i18n';
import { WzButtonPermissionsOpenFlyout } from '../../../common/buttons';
import { useAsyncAction } from '../../../common/hooks';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withPanel,
} from '../../../common/hocs';
import { normalization } from '../../../../utils/applications';
import { WzLink } from '../../../wz-link/wz-link';
import { Name } from './info';
import {
  fetchInternalOpenSearchIndex,
  fetchInternalOpenSearchIndexItemsInTable,
} from '../../services/http';
import {
  SearchBar,
  withInitialQueryFromURL,
} from '../../components/search-bar/search-bar';
import { TableDataFetch } from '../../components/table-data/table-fetch';
import { Id as OverviewId } from '../overview/info';
import { Metadata } from '../../components/metadata/metadata';
import { get } from 'lodash';

const detailsMapLabels: { [key: string]: string } = {
  'document.id': 'ID',
  'document.name': 'Name',
  integration_id: 'Integration ID',
  'document.title': 'Title',
  'document.author': 'Author',
  'document.enabled': 'Enabled',
  'document.metadata.author.url': 'URL',
  'document.references': 'References',
  'document.date': 'Date',
};

const indexName = 'kvdb';
const Details: React.FC<{ item: { id: string; space: string } }> = ({
  item,
}) => {
  const action = useAsyncAction(async () => {
    const response = await fetchInternalOpenSearchIndex(indexName, {
      size: 1,
      query: {
        ids: { values: [item.document.id] },
      },
    });

    const hit = response?.hits?.hits?.[0];

    if (!hit) {
      throw new Error('KVDB not found');
    }

    return hit._source;
  });

  useEffect(() => {
    action.run();
  }, []);

  if (action.running) {
    return <EuiProgress size='xs' color='primary' />;
  }

  if (action.error) {
    return (
      <EuiCallOut
        color='danger'
        title={`Error: ${action.error.message}`}
        iconType='iInCircle'
      />
    );
  }

  if (action.data) {
    return (
      <>
        <EuiTabbedContent
          tabs={[
            {
              id: 'info',
              name: 'Info',
              content: (
                <>
                  <EuiSpacer />
                  <EuiFlexGrid columns={2}>
                    {[
                      'document.id',
                      'document.title',
                      'integration_id',
                      'document.date',
                      'document.author',
                      ['document.enabled', 'boolean_yesno'],
                      'document.references',
                    ].map(item => {
                      const [field, type] =
                        typeof item === 'string' ? [item, 'text'] : item;
                      return (
                        <EuiFlexItem key={field}>
                          <Metadata
                            label={detailsMapLabels[field]}
                            value={get(action.data, field)}
                            type={type as 'text' | 'url'}
                          />
                        </EuiFlexItem>
                      );
                    })}
                  </EuiFlexGrid>
                </>
              ),
            },
            // {
            //   id: 'content',
            //   name: 'Key-Value pairs',
            //   content: <AssetViewer content={action.data.decoder || ''} />,
            // },
          ]}
        />
      </>
    );
  }

  return null;
};

const PageHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return children;
};

const Header: React.FC = () => {
  return (
    <PageHeader>
      <EuiFlexItem>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiText size='s'>
              <h1>{Name}</h1>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
    </PageHeader>
  );
};

const tableColums = [
  {
    field: 'document.title',
    name: 'Title',
    sortable: true,
  },
  {
    field: 'integration_id',
    name: 'Integration',
    sortable: true,
    render: (value: string) => (
      <WzLink
        appId={normalization.id}
        path={`/${
          normalization.id
        }/${OverviewId}?query=document.id:${encodeURIComponent(value)}`}
        toolTipProps={{
          content: i18n.translate(
            'normalization.overview.navigate_to_with_filter',
            {
              defaultMessage:
                'Navigate to {appName} filtering by {integrationName} integration',
              values: { appName: normalization.title, integrationName: value },
            },
          ),
        }}
      >
        {value}
      </WzLink>
    ),
  },
  {
    align: 'right',
    name: 'Actions',
    render: item => (
      <WzButtonPermissionsOpenFlyout
        flyoutTitle={`KVDB details - ${item.document.title}`}
        flyoutBody={() => <Details item={item} />}
        buttonProps={{
          administrator: true,
          buttonType: 'icon',
          iconType: 'inspect',
          'aria-label': 'View KVDB details',
        }}
      ></WzButtonPermissionsOpenFlyout>
    ),
  },
];

const schema = {
  strict: true,
  fields: {
    'document.author': {
      type: 'string',
    },
    'document.date': {
      type: 'date',
    },
    'document.enabled': {
      type: 'boolean',
    },
    'document.id': {
      type: 'string',
    },
    'document.references': {
      type: 'string',
    },
    'document.title': {
      type: 'string',
    },
    integration_id: {
      type: 'string',
    },
  },
};

const filters = [
  {
    type: 'field_value_selection',
    field: 'integration_id',
    name: 'Integration',
    multiSelect: false,
    options: async () => {
      const response = await fetchInternalOpenSearchIndex(indexName, {
        size: 0,
        aggs: {
          integrations: {
            terms: { field: 'integration_id', size: 100 },
          },
        },
      });
      return response.aggregations.integrations.buckets.map((bucket: any) => ({
        value: bucket.key,
        name: bucket.key,
      }));
    },
  },
];

const Body: React.FC = compose(
  withPanel(),
  withInitialQueryFromURL,
)(
  ({
    initialQuery,
    syncQueryURL,
  }: {
    initialQuery?: string;
    syncQueryURL: (query: string) => void;
  }) => {
    const [search, setSearch] = useState(initialQuery || null);
    const [refresh, setRefresh] = useState(0);

    const onChangeSearch = ({ query, queryText }) => {
      syncQueryURL(queryText);
      setSearch(query);
    };

    return (
      <>
        <EuiFlexGroup>
          <EuiFlexItem>
            <SearchBar
              defaultQuery={initialQuery}
              schema={schema}
              onChange={onChangeSearch}
              filters={filters}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              color='primary'
              onClick={() => setRefresh(state => state + 1)}
              size='s'
              iconType='refresh'
            >
              Refresh
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
        <TableDataFetch
          onFetch={async params =>
            fetchInternalOpenSearchIndexItemsInTable(indexName, params)
          }
          tableColumns={tableColums}
          tableInitialSortingField='document.title'
          tableInitialSortingDirection='asc'
          searchParams={
            search
              ? { query: EuiSearchBar.Query.toESQuery(search, schema) }
              : null
          }
          reload={refresh}
        />
      </>
    );
  },
);

export const KVDBs: React.FC = compose(
  withErrorBoundary,
  withGlobalBreadcrumb(() => [
    {
      text: normalization.breadcrumbLabel,
    },
    {
      text: Name,
    },
  ]),
)(() => {
  return (
    <EuiFlexGroup direction='column' gutterSize={'m'}>
      <Header />
      <Body />
    </EuiFlexGroup>
  );
});
