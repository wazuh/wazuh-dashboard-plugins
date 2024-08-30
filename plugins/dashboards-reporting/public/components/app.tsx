/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FormattedMessage, I18nProvider } from '@osd/i18n/react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';

import {
  EuiPage,
  EuiPageBody,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
} from '@elastic/eui';
import CSS from 'csstype';
import {
  CoreStart,
  CoreSystem,
  ChromeBreadcrumb,
  IUiSettingsClient,
} from '../../../../src/core/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';

import { CreateReport } from './report_definitions/create/create_report_definition';
import { Main } from './main/main';
import { ReportDetails } from './main/report_details/report_details';
import { ReportDefinitionDetails } from './main/report_definition_details/report_definition_details';
import { EditReportDefinition } from './report_definitions/edit/edit_report_definition';
import { i18n } from '@osd/i18n';

export interface CoreInterface {
  http: CoreStart['http'];
  uiSettings: IUiSettingsClient;
  setBreadcrumbs: (newBreadcrumbs: ChromeBreadcrumb[]) => void;
}

interface ReportsDashboardsAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
  chrome: CoreStart['chrome'];
}

const styles: CSS.Properties = {
  float: 'left',
  width: '100%',
  maxWidth: '1600px',
};

export const ReportsDashboardsApp = ({
  basename,
  notifications,
  http,
  navigation,
  chrome,
}: ReportsDashboardsAppDeps) => {
  // Render the application DOM.
  return (
    <Router basename={'/' + basename}>
      <I18nProvider>
        <div style={styles}>
          <EuiPage>
            <EuiPageBody>
              <EuiPageContentHeader>
                <EuiPageContentHeaderSection></EuiPageContentHeaderSection>
              </EuiPageContentHeader>
              <EuiPageContentBody>
                <Switch>
                  <Route
                    path="/report_details/:reportId"
                    render={(props) => (
                      <ReportDetails
                        title={i18n.translate(
                          'opensearch.reports.app.reportDetails',
                          { defaultMessage: 'Report Details' }
                        )}
                        httpClient={http}
                        {...props}
                        setBreadcrumbs={chrome.setBreadcrumbs}
                      />
                    )}
                  />
                  <Route
                    path="/report_definition_details/:reportDefinitionId"
                    render={(props) => (
                      <ReportDefinitionDetails
                        title={i18n.translate(
                          'opensearch.reports.app.reportDefinitionDetails',
                          { defaultMessage: 'Report Definition Details' }
                        )}
                        httpClient={http}
                        {...props}
                        setBreadcrumbs={chrome.setBreadcrumbs}
                      />
                    )}
                  />
                  <Route
                    path="/create"
                    render={(props) => (
                      <CreateReport
                        title={i18n.translate(
                          'opensearch.reports.app.createReport',
                          { defaultMessage: 'Create Report' }
                        )}
                        httpClient={http}
                        {...props}
                        setBreadcrumbs={chrome.setBreadcrumbs}
                      />
                    )}
                  />
                  <Route
                    path="/edit/:reportDefinitionId"
                    render={(props) => (
                      <EditReportDefinition
                        title={i18n.translate(
                          'opensearch.reports.app.editReportDefinition',
                          { defaultMessage: 'Edit Report Definition' }
                        )}
                        httpClient={http}
                        {...props}
                        setBreadcrumbs={chrome.setBreadcrumbs}
                      />
                    )}
                  />
                  <Route
                    path="/"
                    render={(props) => (
                      <Main
                        title={i18n.translate(
                          'opensearch.reports.app.reportingHomepage',
                          { defaultMessage: 'Reporting Homepage' }
                        )}
                        httpClient={http}
                        {...props}
                        setBreadcrumbs={chrome.setBreadcrumbs}
                      />
                    )}
                  />
                </Switch>
              </EuiPageContentBody>
            </EuiPageBody>
          </EuiPage>
        </div>
      </I18nProvider>
    </Router>
  );
};
