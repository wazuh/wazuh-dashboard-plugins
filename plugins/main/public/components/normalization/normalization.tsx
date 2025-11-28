import React from 'react';
import {
  Redirect,
  Route,
  RouteComponentProps,
  Switch,
  useParams,
} from 'react-router-dom';
import {
  EuiPage,
  EuiPageBody,
  EuiPageSideBar,
  EuiSideNav,
  EuiSpacer,
  EuiTitle,
} from '@elastic/eui';
import { compose } from 'redux';
import { withErrorBoundary, withGlobalBreadcrumb } from '../common/hocs';
import { normalization } from '../../utils/applications';
import { DecodersView } from './views/decoders';
import { KVDBsView } from './views/kvdbs';
import { OverviewView } from './views/overview';

export const Normalization: React.FC = compose(
  withErrorBoundary,
  withGlobalBreadcrumb(() => [
    {
      text: normalization.breadcrumbLabel,
    },
  ]),
)(({ history }: { history: RouteComponentProps['history'] }) => {
  const { view } = useParams();
  const sideNav = [
    {
      name: normalization.title,
      id: normalization.id,
      renderItem: () => {
        return (
          <>
            <EuiTitle size='xs'>
              <h3>{normalization.title}</h3>
            </EuiTitle>
          </>
        );
      },
      items: [
        {
          name: OverviewView.title,
          id: OverviewView.id,
          onClick: () => {
            history.push(`/${normalization.id}/${OverviewView.id}`);
          },
          isSelected: view === OverviewView.id,
        },
        {
          name: DecodersView.title,
          id: DecodersView.id,
          onClick: () => {
            history.push(`/${normalization.id}/${DecodersView.id}`);
          },
          isSelected: view === DecodersView.id,
        },
        {
          name: KVDBsView.title,
          id: KVDBsView.id,
          onClick: () => {
            history.push(`/${normalization.id}/${KVDBsView.id}`);
          },
          isSelected: view === KVDBsView.id,
        },
      ],
    },
  ];

  return (
    <EuiPage>
      <EuiPageSideBar style={{ minWidth: 200 }}>
        <EuiSideNav style={{ width: 200 }} items={sideNav} />
      </EuiPageSideBar>
      <EuiPageBody>
        <Switch>
          <Route
            path={`/${normalization.id}/${OverviewView.id}`}
            render={OverviewView.component}
          ></Route>
          <Route
            path={`/${normalization.id}/${DecodersView.id}`}
            render={DecodersView.component}
          ></Route>
          <Route
            path={`/${normalization.id}/${KVDBsView.id}`}
            render={KVDBsView.component}
          ></Route>
          <Redirect
            from={`/${normalization.id}`}
            to={`/${normalization.id}/${OverviewView.id}`}
          />
        </Switch>
      </EuiPageBody>
    </EuiPage>
  );
});
