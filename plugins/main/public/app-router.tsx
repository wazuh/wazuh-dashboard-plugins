import React, { useEffect } from 'react';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { ToolsRouter } from './components/tools/tools-router';
import {
  getWazuhCorePlugin,
  getWazuhFleetPlugin,
  getWzMainParams,
} from './kibana-services';
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
import NavigationService from './react-services/navigation-service';
import {
  FleetDataSource,
  FleetDataSourceRepository,
  useDataSource,
  FleetGroupsDataSource,
  FleetGroupsDataSourceRepository,
  FleetCommandsDataSource,
  FleetCommandsDataSourceRepository,
  AlertsDataSource,
  AlertsDataSourceRepository,
} from './components/common/data-source';
import useSearchBar from './components/common/search-bar/use-search-bar';
import { WzSearchBar } from './components/common/search-bar';
import { TableIndexer } from './components/common/tables';
import DocDetails from './components/common/wazuh-discover/components/doc-details';
import { useTimeFilter } from './components/common/hooks';
import { LoadingSpinner } from './components/common/loading-spinner/loading-spinner';

export function Application(props) {
  const dispatch = useDispatch();
  const navigationService = NavigationService.getInstance();
  const history = navigationService.getHistory();

  const { FleetManagement } = getWazuhFleetPlugin();

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

    // TODO: Replace this with document insteat
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
    <Router history={history}>
      <div className='wazuhNotReadyYet'></div>
      {/* TODO: The plugins/main/public/components/wz-menu/wz-menu.js defines a portal to mount here. We could avoid the usage of the React portal and render the component instead*/}
      <WzMenuWrapper />
      <ToastNotificationsModal /> {/* TODO: check if this is being used */}
      <WzAgentSelectorWrapper />
      <WzUpdatesNotification />
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
        <Route
          path={'/fleet-management'}
          render={() => (
            <FleetManagement
              navigationService={NavigationService}
              useDataSource={useDataSource}
              FleetDataSource={FleetDataSource}
              FleetDataSourceRepository={FleetDataSourceRepository}
              FleetGroupsDataSource={FleetGroupsDataSource}
              FleetGroupsDataSourceRepository={FleetGroupsDataSourceRepository}
              FleetCommandsDataSource={FleetCommandsDataSource}
              FleetCommandsDataSourceRepository={
                FleetCommandsDataSourceRepository
              }
              useSearchBar={useSearchBar}
              WzSearchBar={WzSearchBar}
              TableIndexer={TableIndexer}
              DocDetails={DocDetails}
              useTimeFilter={useTimeFilter}
              LoadingSpinner={LoadingSpinner}
              AlertsDataSource={AlertsDataSource}
              AlertsDataSourceRepository={AlertsDataSourceRepository}
            />
          )}
        ></Route>
        <Route path={'/manager'} exact render={WzManagement}></Route>
        <Route
          path={'/overview'}
          exact
          render={props => <Overview {...props} />}
        ></Route>
        <Route path={'/settings'} exact render={Settings}></Route>
        <Route path={'/security'} exact render={WzSecurity}></Route>
        <Route
          path={'/wazuh-dev'}
          exact
          render={props => <ToolsRouter {...props} />}
        ></Route>
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
