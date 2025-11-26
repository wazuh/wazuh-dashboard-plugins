import React from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiText } from '@elastic/eui';
import { compose } from 'redux';
import { i18n } from '@osd/i18n';
import { TableWzAPI } from '../../../common/tables';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withPanel,
  withUserAuthorizationPrompt,
} from '../../../common/hocs';
import { normalization } from '../../../../utils/applications';
import { Name as DecodersName, Id as DecodersId } from '../decoders/info';
import { Name as KVDBsName, Id as KVDBsId } from '../kvdbs/info';
import { WzLink } from '../../../wz-link/wz-link';
import { Name } from './info';

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
        path={`/${normalization.id}/${DecodersId}`}
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
        path={`/${normalization.id}/${KVDBsId}`} // TODO: this should redirect with a filter by integration
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
      title='Integrations'
      endpoint='/integrations/overview'
      tableColumns={tableColums}
      tableInitialSortingField='id'
      tablePageSizeOptions={[10, 25, 50, 100]}
      showReload
    />
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
  withUserAuthorizationPrompt(() => [
    [
      // TODO: define permissions needed to view KVDBs
      // { action: 'agent:read', resource: `agent:id:${agent.id}` },
    ],
  ]),
)(() => {
  return (
    <EuiFlexGroup direction='column' gutterSize={'m'}>
      <Header />
      <Body />
    </EuiFlexGroup>
  );
});
