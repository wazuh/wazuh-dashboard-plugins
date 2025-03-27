import React from 'react';
import { I18nProvider } from '@osd/i18n/react';
import { EuiPage, EuiPageBody, EuiPanel } from '@elastic/eui';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { IndexPattern } from '../../../../src/plugins/data/common';
import { getWazuhCore } from '../plugin-services';
import { summaryAgent, views } from './common/views';
import { RouteComponent } from './common/route-component';

export interface FleetManagementProps {
  indexPatterns: IndexPattern;
}

export const FleetManagement = ({ ...restProps }: FleetManagementProps) => {
  const navigationService = getWazuhCore().navigationService.getInstance();
  const history = navigationService.getHistory();

  return (
    <Router history={history}>
      <I18nProvider>
        <EuiPage>
          <EuiPageBody>
            <EuiPanel paddingSize='l'>
              <Switch>
                {views.map(view => (
                  <Route
                    key={view.id}
                    path={`${view.path}`}
                    exact
                    render={() => (
                      <RouteComponent view={view} restProps={restProps} />
                    )}
                  />
                ))}
                <Redirect to={summaryAgent.path} />
              </Switch>
            </EuiPanel>
          </EuiPageBody>
        </EuiPage>
      </I18nProvider>
    </Router>
  );
};
