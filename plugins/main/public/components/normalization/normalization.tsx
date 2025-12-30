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
import { KVDBsView } from './views/kvdbs';
import { OverviewView } from './views/overview';
import { getUiSettings } from '../../kibana-services';
import NavigationService from '../../react-services/navigation-service';

enum Navigation {
  SecurityAnalytics = 'Security Analytics',
  Findings = 'Findings',
  Detectors = 'Detectors',
  Rules = 'Detection rules',
  Overview = 'Overview',
  Alerts = 'Alerts',
  Correlations = 'Correlations',
  CorrelationRules = 'Correlation rules',
  LogTypes = 'Integrations',
  Insights = 'Insights',
  Detection = 'Detection',
  KVDBs = 'KVDBs',
  OverviewNormalization = 'OverviewNormalization',
  Normalization = 'Normalization',
}

const applicationsId = {
  saOverview: 'sa_overview',
  findings: 'findings',
  threatAlerts: 'threat_alerts',
  detectors: 'detectors',
  detectionRules: 'detection_rules',
  logTypes: 'log_types',
  // Wazuh: hide Correlations app ids from navigation.
  // correlations: 'correlations',
  // correlationRules: 'correlation_rules',
  normalization: 'normalization',
  kvdbs: 'kvdbs',
};

const ROUTES = Object.freeze({
  ROOT: '/',
  ALERTS: '/alerts',
  DETECTORS: '/detectors',
  FINDINGS: '/findings',
  OVERVIEW: '/overview',
  GETTING_STARTED: '/getting-started',
  RULES: '/rules',
  RULES_CREATE: '/create-rule',
  RULES_EDIT: '/edit-rule',
  RULES_IMPORT: '/import-rule',
  RULES_DUPLICATE: '/duplicate-rule',
  DETECTORS_CREATE: '/create-detector',
  DETECTOR_DETAILS: '/detector-details',
  EDIT_DETECTOR_DETAILS: '/edit-detector-details',
  EDIT_DETECTOR_RULES: '/edit-detector-rules',
  EDIT_FIELD_MAPPINGS: '/edit-field-mappings',
  EDIT_DETECTOR_ALERT_TRIGGERS: '/edit-alert-triggers',
  CORRELATIONS: '/correlations',
  CORRELATION_RULES: '/correlations/rules',
  CORRELATION_RULE_CREATE: '/correlations/create-rule',
  CORRELATION_RULE_EDIT: '/correlations/rule',
  LOG_TYPES: '/log-types',
  LOG_TYPES_CREATE: '/create-log-type',
  THREAT_INTEL_OVERVIEW: '/threat-intel',
  THREAT_INTEL_ADD_CUSTOM_SOURCE: '/add-threat-intel-source',
  THREAT_INTEL_CREATE_SCAN_CONFIG: '/create-scan-config',
  THREAT_INTEL_EDIT_SCAN_CONFIG: '/edit-scan-config',
  THREAT_INTEL_SOURCE_DETAILS: '/threat-intel-source',

  get LANDING_PAGE(): string {
    return this.OVERVIEW;
  },
});

export const Normalization: React.FC = compose(withErrorBoundary)(
  ({ history }: { history: RouteComponentProps['history'] }) => {
    const { view } = useParams();
    const sideNav = [
      {
        name: Navigation.SecurityAnalytics,
        id: Navigation.SecurityAnalytics,
        renderItem: () => {
          return (
            <>
              <EuiTitle size='xs'>
                <h3>{Navigation.SecurityAnalytics}</h3>
              </EuiTitle>
              <EuiSpacer />
            </>
          );
        },
        items: [
          {
            name: Navigation.Overview,
            id: Navigation.Overview,
            onClick: () => {
              NavigationService.getInstance(history).navigateToApp(
                applicationsId.saOverview,
                {
                  path: `#${ROUTES.OVERVIEW}`,
                },
              );
            },
            isSelected: view === Navigation.Overview,
          },
          {
            name: Navigation.Insights,
            id: Navigation.Insights,
            forceOpen: true,
            items: [
              {
                name: Navigation.Findings,
                id: Navigation.Findings,
                onClick: () => {
                  NavigationService.getInstance(history).navigateToApp(
                    applicationsId.findings,
                    {
                      path: `#${ROUTES.FINDINGS}`,
                    },
                  );
                },
                isSelected: view === Navigation.Findings,
              },
              {
                name: Navigation.Alerts,
                id: Navigation.Alerts,
                onClick: () => {
                  NavigationService.getInstance(history).navigateToApp(
                    applicationsId.threatAlerts,
                    {
                      path: `#${ROUTES.ALERTS}`,
                    },
                  );
                },
                isSelected: view === Navigation.Alerts,
              },
              {
                name: Navigation.Correlations,
                id: Navigation.Correlations,
                onClick: () => {
                  NavigationService.getInstance(history).navigateToApp(
                    applicationsId.correlations,
                    {
                      path: `#${ROUTES.CORRELATIONS}`,
                    },
                  );
                },
                isSelected: view === Navigation.Correlations,
              },
            ],
          },
          {
            name: Navigation.LogTypes,
            id: Navigation.LogTypes,
            onClick: () => {
              NavigationService.getInstance(history).navigateToApp(
                applicationsId.logTypes,
                {
                  path: `#${ROUTES.LOG_TYPES}`,
                },
              );
            },
            isSelected: view === Navigation.LogTypes,
          },
          {
            name: Navigation.Normalization,
            id: Navigation.OverviewNormalization,
            forceOpen: true,
            items: [
              {
                name: Navigation.Overview,
                id: Navigation.OverviewNormalization,
                onClick: () => {
                  NavigationService.getInstance(history).navigateToApp(
                    applicationsId.normalization,
                    {
                      path: `#/${normalization.id}/${OverviewView.id}`,
                    },
                  );
                },
                isSelected: view === OverviewView.id,
              },
              {
                name: KVDBsView.title,
                id: KVDBsView.id,
                onClick: () => {
                  history.push(`/${normalization.id}/${KVDBsView.id}`);
                  NavigationService.getInstance(history).navigateToApp(
                    applicationsId.kvdbs,
                    {
                      path: `#/${normalization.id}/${KVDBsView.id}`,
                    },
                  );
                },
                isSelected: view === KVDBsView.id,
              },
            ],
          },
          {
            name: Navigation.Detection,
            id: Navigation.Detection,
            forceOpen: true,
            items: [
              {
                name: Navigation.Detectors,
                id: Navigation.Detectors,
                onClick: () => {
                  NavigationService.getInstance(history).navigateToApp(
                    applicationsId.detectors,
                    {
                      path: `#${ROUTES.DETECTORS}`,
                    },
                  );
                },
                isSelected: view === Navigation.Detectors,
              },
              {
                name: Navigation.Rules,
                id: Navigation.Rules,
                onClick: () => {
                  NavigationService.getInstance(history).navigateToApp(
                    applicationsId.detectionRules,
                    {
                      path: `#${ROUTES.RULES}`,
                    },
                  );
                },
                isSelected: view === Navigation.Rules,
              },
              {
                name: Navigation.CorrelationRules,
                id: Navigation.CorrelationRules,
                onClick: () => {
                  NavigationService.getInstance(history).navigateToApp(
                    applicationsId.correlationRules,
                    {
                      path: `#${ROUTES.CORRELATION_RULES}`,
                    },
                  );
                },
                isSelected: view === Navigation.CorrelationRules,
              },
            ],
          },
        ],
      },
    ];

    return (
      <EuiPage>
        {!getUiSettings().get('home:useNewHomePage') && (
          <EuiPageSideBar style={{ minWidth: 200 }}>
            <EuiSideNav style={{ width: 200 }} items={sideNav} />
          </EuiPageSideBar>
        )}
        <EuiPageBody>
          <Switch>
            <Route
              path={`/${normalization.id}/${OverviewView.id}`}
              render={OverviewView.component}
            ></Route>
            <Route
              path={`/${normalization.id}/${KVDBsView.id}`}
              render={KVDBsView.component}
            ></Route>
            <Redirect
              from={`/${normalization.id}/decoders`}
              to={`/${normalization.id}/${OverviewView.id}`}
            />
            <Redirect
              from={`/${normalization.id}`}
              to={`/${normalization.id}/${OverviewView.id}`}
            />
          </Switch>
        </EuiPageBody>
      </EuiPage>
    );
  },
);
