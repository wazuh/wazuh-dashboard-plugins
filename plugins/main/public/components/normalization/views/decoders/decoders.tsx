import React, { useEffect, useState } from 'react';
import {
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexGrid,
  EuiFlexItem,
  EuiProgress,
  EuiTabbedContent,
  EuiText,
  EuiTitle,
  EuiSearchBar,
  EuiSpacer,
} from '@elastic/eui';
import { compose } from 'redux';
import { WzButtonPermissionsOpenFlyout } from '../../../common/buttons';
import { AssetViewer } from './asset-viewer';
import { useAsyncAction } from '../../../common/hooks';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withPanel,
} from '../../../common/hocs';
import { normalization } from '../../../../utils/applications';
import { i18n } from '@osd/i18n';
import { WzLink } from '../../../wz-link/wz-link';
import { Name } from './info';
import { Name as OverviewName, Id as OverviewId } from '../overview/info';
import { TableDataFetch } from '../../components/table-data/table-fetch';
import {
  fetchInternalOpenSearchIndexItemsInTable,
  fetchInternalOpenSearchIndex,
} from '../../services/http';
import {
  SearchBar,
  withInitialQueryFromURL,
} from '../../components/search-bar/search-bar';
import { Metadata } from '../../components/metadata/metadata';
import { get } from 'lodash';

const detailsMapLabels: { [key: string]: string } = {
  'document.id': 'ID',
  'document.name': 'Name',
  integration_id: 'Integration ID',
  'document.metadata.title': 'Title',
  'document.metadata.module': 'Module',
  'document.metadata.compatibility': 'Compatibility',
  'document.metadata.versions': 'Versions',
  'document.metadata.author.name': 'Name',
  'document.metadata.author.email': 'Email',
  'document.metadata.author.url': 'URL',
  'document.metadata.author.date': 'Date',
};

const indexName = 'decoders';
const Details: React.FC<{ item: { document: { id: string } } }> = ({
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
      throw new Error('Decoder not found');
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
                    'integration_id',
                    'document.metadata.title',
                    'document.metadata.module',
                    'document.metadata.compatibility',
                    'document.metadata.versions',
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
                <EuiSpacer />

                {action.data?.document?.metadata?.author && (
                  <>
                    <EuiTitle size='s'>
                      <h5>Author</h5>
                    </EuiTitle>
                    <EuiSpacer size='s' />
                    <EuiFlexGrid columns={2}>
                      {[
                        'document.metadata.author.name',
                        'document.metadata.author.email',
                        ['document.metadata.author.url', 'url'],
                        'document.metadata.author.date',
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
                )}
                <EuiSpacer />
                {action.data?.document?.metadata?.description && (
                  <>
                    <EuiTitle size='s'>
                      <h5>Description</h5>
                    </EuiTitle>
                    <EuiSpacer size='s' />
                    <Metadata
                      label=''
                      value={action.data.document.metadata.description}
                      type={'text'}
                    />
                  </>
                )}
              </>
            ),
          },
          {
            id: 'content',
            name: 'File',
            content: <AssetViewer content={action.data.decoder || ''} />,
          },
        ]}
      />
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
    field: 'document.name',
    name: 'Name',
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
              values: { appName: OverviewName, integrationName: value },
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
        flyoutTitle={`Decoder details - ${item.document.name}`}
        flyoutBody={() => <Details item={item} />}
        buttonProps={{
          administrator: true,
          buttonType: 'icon',
          iconType: 'inspect',
          'aria-label': 'View Decoder details',
        }}
      ></WzButtonPermissionsOpenFlyout>
    ),
  },
];

const schema = {
  strict: true,
  fields: {
    'document.check': {
      type: 'string',
    },
    'document.enabled': {
      type: 'boolean',
    },
    'document.id': {
      type: 'string',
    },
    'document.metadata.author.date': {
      type: 'date',
    },
    'document.metadata.author.name': {
      type: 'string',
    },
    'document.metadata.compatibility': {
      type: 'string',
    },
    'document.metadata.description': {
      type: 'string',
    },
    'document.metadata.module': {
      type: 'string',
    },
    'document.metadata.references': {
      type: 'string',
    },
    'document.metadata.title': {
      type: 'string',
    },
    'document.metadata.versions': {
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
          tableInitialSortingField='document.name'
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

export const Decoders: React.FC = compose(
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
