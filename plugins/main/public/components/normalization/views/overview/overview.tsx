import React, { useState } from 'react';
import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSearchBar,
  EuiText,
} from '@elastic/eui';
import { compose } from 'redux';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withPanel,
} from '../../../common/hocs';
import {
  breadcrumbLabelSecurityAnalytics,
  normalization,
} from '../../../../utils/applications';
import { Name, indexName } from './info';
import { TableDataFetch } from '../../components/table-data/table-fetch';
import { fetchInternalOpenSearchIndexItemsInTable } from '../../services/http';
import {
  SearchBar,
  withInitialQueryFromURL,
} from '../../components/search-bar/search-bar';
import { ButtonOpenFlyout } from '../../components/buttons';
import { Details } from './details';
import { getUiSettings } from '../../../../kibana-services';

const decodersCountKey = '___decoders_count';
const kvdbsCountKey = '___kvdbs_count';
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
    name: 'Name',
    sortable: true,
  },
  {
    field: decodersCountKey,
    name: 'Decoders',
    sortable: false,
  },
  {
    field: kvdbsCountKey,
    name: 'KVDBs',
    sortable: false,
  },
  {
    align: 'right',
    name: 'Actions',
    render: item => (
      <ButtonOpenFlyout
        flyoutTitle={`Integration details - ${item.document.title}`}
        flyoutBody={() => <Details item={item} />}
        buttonProps={{
          tooltip: { content: 'View details' },
          buttonType: 'icon',
          iconType: 'inspect',
          'aria-label': 'View integration details',
        }}
      ></ButtonOpenFlyout>
    ),
  },
];

const schema = {
  strict: true,
  fields: {
    'document.author': {
      type: 'string',
    },
    'document.category': {
      type: 'string',
    },
    'document.date': {
      type: 'date',
    },
    'document.decoders': {
      type: 'string',
    },
    'document.description': {
      type: 'string',
    },
    'document.documentation': {
      type: 'string',
    },
    'document.enable_decoders': {
      type: 'boolean',
    },
    'document.id': {
      type: 'string',
    },
    'document.kvdbs': {
      type: 'string',
    },
    'document.references': {
      type: 'string',
    },
    'document.title': {
      type: 'string',
    },
  },
};

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

    /* FIXME: with a query in the URL for previous search, use the back button does not update the search.
    This happens on Decoders and KVDBs views as well.
    */

    return (
      <>
        <EuiFlexGroup>
          <EuiFlexItem>
            <SearchBar
              defaultQuery={initialQuery}
              schema={schema}
              onChange={onChangeSearch}
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
            fetchInternalOpenSearchIndexItemsInTable(indexName, params, {
              mapResponseItem: item => ({
                ...item,
                ___decoders_count: item.document.decoders.length,
                ___kvdbs_count: item.document.kvdbs.length,
              }),
            })
          }
          tableColumns={tableColums}
          tableInitialPageSize={25}
          tableInitialSortingField='document.title'
          tableInitialSortingDirection='asc'
          searchParams={
            search ? { query: EuiSearchBar.Query.toESQuery(search) } : null
          }
          reload={refresh}
        />
      </>
    );
  },
);

export const Overview: React.FC = compose(
  withErrorBoundary,
  withGlobalBreadcrumb(() => [
    {
      text: breadcrumbLabelSecurityAnalytics,
    },
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
      {!getUiSettings().get('home:useNewHomePage') && <Header />}
      <Body />
    </EuiFlexGroup>
  );
});
