import React, { useEffect, useState } from 'react';
import {
  EuiAccordion,
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
import { ButtonOpenFlyout } from '../../components/buttons';
import { useAsyncAction } from '../../../common/hooks';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withPanel,
} from '../../../common/hocs';
import { normalization } from '../../../../utils/applications';
import { WzLink } from '../../../wz-link/wz-link';
import { Name, indexName } from './info';
import {
  Name as OverviewName,
  indexName as OverviewIndexName,
} from '../overview/info';
import {
  fetchInternalOpenSearchIndex,
  fetchInternalOpenSearchIndexItemsInTableRelation,
  fetchInternalOpenSearchIndexItemsRelation,
} from '../../services/http';
import {
  SearchBar,
  withInitialQueryFromURL,
} from '../../components/search-bar/search-bar';
import { TableDataFetch } from '../../components/table-data/table-fetch';
import { Id as OverviewId } from '../overview/info';
import { Metadata } from '../../components/metadata/metadata';
import { get, omit } from 'lodash';
import { AssetViewer } from './asset-viewer';
import { JSONViewer } from '../../components/json-viewer/json-viewer';

const relationIntegrationIDField = '__integration';

const detailsMapLabels: { [key: string]: string } = {
  'document.id': 'ID',
  'document.name': 'Name',
  [`${relationIntegrationIDField}.document.title`]: 'Integration',
  'document.title': 'Title',
  'document.author': 'Author',
  'document.enabled': 'Enabled',
  'document.metadata.author.url': 'URL',
  'document.references': 'References',
  'document.date': 'Date',
};

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

    const [hitWithRelation] = await fetchInternalOpenSearchIndexItemsRelation(
      [hit._source],
      {
        'document.id': {
          field: 'document.id',
          indexField: 'document.kvdbs',
          index: OverviewIndexName,
          target_field: relationIntegrationIDField,
        },
      },
    );

    return hitWithRelation;
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
              id: 'visual',
              name: 'Visual',
              content: (
                <>
                  <EuiSpacer />
                  <EuiFlexGrid columns={2}>
                    {[
                      'document.id',
                      `${relationIntegrationIDField}.document.title`,
                      'document.title',
                      ['document.date', 'date'],
                      'document.author',
                      ['document.enabled', 'boolean_yesno'],
                      ['document.references', 'url'],
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
                  {action.data?.document?.content && (
                    <>
                      <EuiSpacer />
                      <EuiAccordion
                        id='content'
                        buttonContent='Content'
                        paddingSize='s'
                        initialIsOpen={true}
                      >
                        <AssetViewer content={action.data.document.content} />
                      </EuiAccordion>
                    </>
                  )}
                </>
              ),
            },
            {
              id: 'json',
              name: 'JSON',
              content: (
                <JSONViewer
                  data={omit(action.data, [relationIntegrationIDField])}
                />
              ),
            },
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
    field: `${relationIntegrationIDField}.document.title`,
    name: 'Integration',
    sortable: false,
    render: (value: string) => (
      <WzLink
        appId={normalization.id}
        path={`/${
          normalization.id
        }/${OverviewId}?query=document.title:${encodeURIComponent(value)}`}
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
      <ButtonOpenFlyout
        flyoutTitle={`KVDB details - ${item.document.title}`}
        flyoutBody={() => <Details item={item} />}
        buttonProps={{
          tooltip: { content: 'View details' },
          buttonType: 'icon',
          iconType: 'inspect',
          'aria-label': 'View KVDB details',
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
            fetchInternalOpenSearchIndexItemsInTableRelation(
              indexName,
              params,
              {
                relations: {
                  'document.id': {
                    field: 'document.id',
                    indexField: 'document.kvdbs',
                    index: OverviewIndexName,
                    target_field: relationIntegrationIDField,
                  },
                },
              },
            )
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
