import React, { useState } from 'react';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSearchBar,
  EuiText,
} from '@elastic/eui';
import { compose } from 'redux';
import { i18n } from '@osd/i18n';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withPanel,
} from '../../../common/hocs';
import { normalization } from '../../../../utils/applications';
import { Name as DecodersName, Id as DecodersId } from '../decoders/info';
import { Name as KVDBsName, Id as KVDBsId } from '../kvdbs/info';
import { WzLink } from '../../../wz-link/wz-link';
import { Name } from './info';
import { TableDataFetch } from '../../components/table-data/table-fetch';
import { fetchInternalOpenSearchIndexItemsInTable } from '../../services/http';
import {
  SearchBar,
  withInitialQueryFromURL,
} from '../../components/search-bar/search-bar';

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
    field: 'decoders_count',
    name: 'Decoders',
    sortable: true,
    render: (value: string, item: { name: string }) => (
      <WzLink
        appId={normalization.id}
        path={`/${
          normalization.id
        }/${DecodersId}?query=integration:${encodeURIComponent(item.name)}`}
        toolTipProps={{
          content: i18n.translate(
            'normalization.decoders.navigate_to_with_filter',
            {
              defaultMessage: `Navigate to {appName} filtering by {integrationName} integration`,
              values: { appName: DecodersName, integrationName: item.name },
            },
          ),
        }}
      >
        {value}
      </WzLink>
    ),
  },
  {
    field: 'kvdbs_count',
    name: 'KVDBs',
    sortable: true,
    render: (value: string, item: { name: string }) => (
      <WzLink
        appId={normalization.id}
        path={`/${
          normalization.id
        }/${KVDBsId}?query=integration:${encodeURIComponent(item.name)}`}
        toolTipProps={{
          content: i18n.translate(
            'normalization.kvdbs.navigate_to_with_filter',
            {
              defaultMessage: `Navigate to {appName} filtering by {integrationName} integration`,
              values: { appName: KVDBsName, integrationName: item.name },
            },
          ),
        }}
      >
        {value}
      </WzLink>
    ),
  },
];

const schema = {
  strict: true,
  fields: {
    name: {
      type: 'string',
    },
    decoders_count: {
      type: 'number',
    },
    kvdbs_count: {
      type: 'number',
    },
  },
};

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
          fetchInternalOpenSearchIndexItemsInTable('integrations', params)
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

export const Overview: React.FC = compose(
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
