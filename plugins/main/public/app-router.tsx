import React, { useEffect } from 'react';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
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
import { RegisterAgent } from './components/endpoints-summary/register-agent';
import { MainEndpointsSummary } from './components/endpoints-summary';
import { AgentView } from './components/endpoints-summary/agent';
import WzManagement from './controllers/management/components/management/management-provider';
import { Overview } from './components/overview/overview';
import { Settings } from './components/settings';
import { WzSecurity } from './components/security';
import $ from 'jquery';
import NavigationService from './react-services/navigation-service';
import { SECTIONS } from './sections';

export function Application(props) {
  const dispatch = useDispatch();
  const navigationService = NavigationService.getInstance();
  const history = navigationService.getHistory();

  useEffect(() => {
    // Get the dashboard security
    getWazuhCorePlugin()
      .dashboardSecurity.fetchCurrentPlatform()
      .then((item) => {
        dispatch(updateCurrentPlatform(item));
      })
      .catch(() => {});

    // Init the process of refreshing the user's token when app starts.
    checkPluginVersion().finally(() => {
      WzAuthentication.refresh();
    });

    // Load the app state
    loadAppConfig();

    // TODO: Replace this with document insteat
    // Bind deleteExistentToken on Log out component.
    $('.euiHeaderSectionItem__button, .euiHeaderSectionItemButton').on('mouseleave', function () {
      // opendistro
      $('button:contains(Log out)').on('click', function () {
        WzAuthentication.deleteExistentToken();
      });
    });
  }, []);

  return (
    <Router history={history}>
      <div className='wazuhNotReadyYet'></div>
      {/* TODO: The plugins/main/public/components/wz-menu/wz-menu.js defines a portal to mount here. We could avoid the usage of the React portal and render the component instead*/}
      <WzMenuWrapper />
      <ToastNotificationsModal /> {/* TODO: check if this is being used */}
      <WzAgentSelectorWrapper />
      <WzUpdatesNotification />
      <Switch>
        <Route path={`/${SECTIONS.HEALTH_CHECK}`} exact render={HealthCheck}></Route>
        <Route path={`/${SECTIONS.AGENTS_PREVIEW}/deploy`} exact render={RegisterAgent}></Route>
        <Route path={`/${SECTIONS.AGENTS}`} exact render={AgentView}></Route>
        <Route path={`/${SECTIONS.AGENTS_PREVIEW}/`} exact render={MainEndpointsSummary}></Route>
        <Route path={`/${SECTIONS.MANAGER}`} exact render={WzManagement}></Route>
        <Route path={`/${SECTIONS.OVERVIEW}`} exact render={(props) => <Overview {...props} />}></Route>
        <Route path={`/${SECTIONS.SETTINGS}`} exact render={Settings}></Route>
        <Route path={`/${SECTIONS.SECURITY}`} exact render={WzSecurity}></Route>
        <Route path={`/${SECTIONS.WAZUH_DEV}`} exact render={(props) => <ToolsRouter {...props} />}></Route>
        <Route
          path={`/${SECTIONS.BLANK_SCREEN}`}
          exact
          render={(props) => <WzBlankScreen {...props} />}
        ></Route>
        <Redirect from='/' to={getWzMainParams()} />
      </Switch>
    </Router>
  );
}
