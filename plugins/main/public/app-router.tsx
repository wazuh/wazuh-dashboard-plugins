import React, { useEffect } from 'react';
import {
  HashRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom';
import { ToolsRouter } from './components/tools/tools-router';
import { getWazuhCorePlugin, getWzMainParams } from './kibana-services';
import { updateCurrentPlatform } from './redux/actions/appStateActions';
import { useDispatch } from 'react-redux';
import { checkPluginVersion } from './utils';
import { WzAuthentication, loadAppConfig } from './react-services';
import { WzMenuWrapper } from './components/wz-menu/wz-menu-wrapper';
import { WzAgentSelectorWrapper } from './components/wz-agent-selector/wz-agent-selector-wrapper';
import { ToastNotificationsModal } from './components/notifications/modal';
import { WzUpdatesNotification } from './components/wz-updates-notification';
import { HealthCheck } from './components/health-check';
import { WzBlankScreen } from './components/wz-blank-screen/wz-blank-screen';
import { RegisterAgent } from './components/endpoints-summary/register-agent/containers/register-agent/register-agent';
import { MainEndpointsSummary } from './components/endpoints-summary';
import { AgentView } from './components/endpoints-summary/agent';
import WzManagement from './controllers/management/components/management/management-provider';
import { Overview } from './components/overview/overview';
import { Settings } from './components/settings';
import { WzSecurity } from './components/security';
import $ from 'jquery';

export function Application(props) {
  const dispatch = useDispatch();

  useEffect(() => {
    // Get the dashboard security
    getWazuhCorePlugin()
      .dashboardSecurity.fetchCurrentPlatform()
      .then(item => {
        dispatch(updateCurrentPlatform(item));
      })
      .catch(() => {});

    // Init the process of refreshing the user's token when app starts.
    checkPluginVersion().finally(() => {
      WzAuthentication.refresh();
    });

    // Load the app state
    loadAppConfig();

    // Bind deleteExistentToken on Log out component.
    $('.euiHeaderSectionItem__button, .euiHeaderSectionItemButton').on(
      'mouseleave',
      function () {
        // opendistro
        $('button:contains(Log out)').on('click', function () {
          WzAuthentication.deleteExistentToken();
        });
      },
    );
  }, []);

  return (
    <>
      {/* <div class="wazuhNotReadyYet"></div>
    <div ng-view class="mainView"></div>
     */}
      {/* <WzMenuWrapper />
      <WzAgentSelectorWrapper />
      <ToastNotificationsModal />
      <WzUpdatesNotification /> */}
      <AppRouter {...props} />
    </>
  );
}

export function AppRouter(props) {
  const { history } = props.params;

  return (
    <Router basename={props.params.appBasePath} history={history}>
      {' '}
      {/* TODO: the base path is duplicated in the URL. See dashboard security plugin. */}
      <Switch>
        <Route path={'/health-check'} exact render={HealthCheck}></Route>
        <Route
          path={'/agents-preview/deploy'}
          exact
          render={RegisterAgent}
        ></Route>
        <Route path={'/agents'} exact render={AgentView}></Route>
        <Route
          path={'/agents-preview/'}
          exact
          render={MainEndpointsSummary}
        ></Route>
        <Route path={'/manager'} exact render={WzManagement}></Route>
        <Route
          path={'/overview'}
          exact
          render={props => <Overview {...props} />}
        ></Route>
        <Route path={'/settings'} exact render={Settings}></Route>
        <Route path={'/security'} exact render={WzSecurity}></Route>
        <Route path={'/wazuh-dev'} exact render={ToolsRouter}></Route>
        <Route
          path={'/blank-screen'}
          exact
          render={props => <WzBlankScreen {...props} />}
        ></Route>
        <Redirect from='/' to={getWzMainParams()} />
      </Switch>
    </Router>
  );
}
