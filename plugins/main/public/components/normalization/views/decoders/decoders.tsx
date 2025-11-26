import React, { useEffect } from 'react';
import {
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiPage,
  EuiProgress,
} from '@elastic/eui';
import { compose } from 'redux';
import { TableWzAPI } from '../../../common/tables';
import { WzButtonPermissionsOpenFlyout } from '../../../common/buttons';
import { AssetViewer } from './asset-viewer';
import { useAsyncAction } from '../../../common/hooks';
import { WzRequest } from '../../../../react-services';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withPanel,
  withUserAuthorizationPrompt,
} from '../../../common/hocs';
import { normalization } from '../../../../utils/applications';
import { i18n } from '@osd/i18n';
import { WzLink } from '../../../wz-link/wz-link';
import { Name } from './info';
import { Name as OverviewName, Id as OverviewId } from '../overview/info';

const Details: React.FC<{ item: { id: string; space: string } }> = ({
  item,
}) => {
  const action = useAsyncAction(async () => {
    const response = await WzRequest.apiReq(
      'GET',
      `/content/asset/${item.space}/${item.id}`,
      {},
    );
    return response.data.data.content;
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
        path={`/${normalization.id}/${OverviewId}`}
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

const Body: React.FC = compose(
  withPanel(),
  withUserAuthorizationPrompt(() => [
    [
      // TODO: define permissions needed to view KVDBs
      // { action: 'agent:read', resource: `agent:id:${agent.id}` },
    ],
  ]),
)(() => {
  return (
    <TableWzAPI
      title='Decoders'
      endpoint='/integrations/decoders'
      tableColumns={tableColums}
      tableInitialSortingField='id'
      tablePageSizeOptions={[10, 25, 50, 100]}
      showReload
    />
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
    <EuiPage>
      <EuiFlexGroup direction='column' gutterSize={'m'}>
        <Header />
        <Body />
      </EuiFlexGroup>
    </EuiPage>
  );
});
