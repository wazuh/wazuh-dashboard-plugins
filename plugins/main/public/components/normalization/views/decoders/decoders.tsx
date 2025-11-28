import React, { useEffect, useState } from 'react';
import {
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiProgress,
  EuiSearchBar,
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

const Details: React.FC<{ item: { name: string } }> = ({ item }) => {
  const action = useAsyncAction(async () => {
    const response = await fetchInternalOpenSearchIndex('decoders', {
      size: 1,
      query: {
        match: { name: item.name },
      },
    });

    const hit = response?.hits?.hits?.[0];

    if (!hit) {
      throw new Error('Decoder not found');
    }

    return hit._source.text;
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
    return <AssetViewer content={action.data} />;
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
    field: 'name',
    name: 'Name',
    sortable: true,
  },
  {
    field: 'integration',
    name: 'Integration',
    sortable: true,
    render: (value: string) => (
      <WzLink
        appId={normalization.id}
        path={`/${
          normalization.id
        }/${OverviewId}?query=name:${encodeURIComponent(value)}`}
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
        flyoutTitle={`Decoder details - ${item.name}`}
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
    name: {
      type: 'string',
    },
    integration: {
      type: 'string',
    },
  },
};

const filters = [
  {
    type: 'field_value_selection',
    field: 'integration',
    name: 'Integration',
    multiSelect: false,
    options: async () => {
      const response = await fetchInternalOpenSearchIndex('decoders', {
        size: 0,
        aggs: {
          integrations: {
            terms: { field: 'integration', size: 100 },
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
)(({ initialQuery }: { initialQuery?: string }) => {
  const [search, setSearch] = useState(initialQuery || null);
  const [refresh, setRefresh] = useState(0);

  return (
    <>
      <EuiFlexGroup>
        <EuiFlexItem>
          <SearchBar
            defaultQuery={initialQuery}
            schema={schema}
            onChange={setSearch}
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
          fetchInternalOpenSearchIndexItemsInTable('decoders', params)
        }
        tableColumns={tableColums}
        tableInitialSortingField='name'
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
});

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
