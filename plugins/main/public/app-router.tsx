import React, { useEffect } from 'react';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { ToolsRouter } from './components/tools/tools-router';
import {
  getPlugins,
  getWazuhCorePlugin,
  getWazuhEnginePlugin,
  getWazuhFleetPlugin,
  getWzMainParams,
} from './kibana-services';
import { updateCurrentPlatform } from './redux/actions/appStateActions';
import { useDispatch } from 'react-redux';
import { checkPluginVersion } from './utils';
import {
  WzAuthentication,
  AppState,
  GenericRequest,
  WzRequest,
  loadAppConfig,
} from './react-services';
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
import {
  RulesDataSource,
  RulesDataSourceRepository,
} from './components/common/data-source/pattern/rules';
import { useDocViewer } from './components/common/doc-viewer';
import DocViewer from './components/common/doc-viewer/doc-viewer';
import { WazuhFlyoutDiscover } from './components/common/wazuh-discover/wz-flyout-discover';
import {
  FILTER_OPERATOR,
  PatternDataSource,
  PatternDataSourceFilterManager,
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
import { DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER } from '../common/constants';
import { useForm } from './components/common/form/hooks';
import { InputForm } from './components/common/form';
import useSearchBar from './components/common/search-bar/use-search-bar';
import { WzSearchBar } from './components/common/search-bar';
import { TableIndexer, TableIndexerEngine } from './components/common/tables';
import DocDetails from './components/common/wazuh-discover/components/doc-details';
import { useTimeFilter } from './components/common/hooks';
import { LoadingSpinner } from './components/common/loading-spinner/loading-spinner';

import { TableWzAPI } from './components/common/tables';
import WzListEditor from './controllers/management/components/management/cdblists/views/list-editor.tsx';
import { DocumentViewTableAndJson } from './components/common/wazuh-discover/components/document-view-table-and-json';
import { OutputsDataSource } from './components/common/data-source/pattern/outputs/data-source';
import { OutputsDataSourceRepository } from './components/common/data-source/pattern/outputs/data-source-repository';
import WzDecoderInfo from './controllers/management/components/management/decoders/views/decoder-info.tsx';
import {
  IntegrationsDataSource,
  IntegrationsDataSourceRepository,
} from './components/common/data-source/pattern/integrations';
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
        <Route
          path={'/engine'}
          render={props => {
            const { Engine } = getWazuhEnginePlugin();
            return (
              <Engine
                navigationService={NavigationService}
                DashboardContainerByValueRenderer={
                  getPlugins().dashboard.DashboardContainerByValueRenderer
                }
                TableIndexer={TableIndexerEngine}
                WazuhFlyoutDiscover={WazuhFlyoutDiscover}
                PatternDataSource={PatternDataSource}
                PatternDataSourceFilterManager={PatternDataSourceFilterManager}
                AppState={AppState}
                DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER={
                  DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER
                }
                FILTER_OPERATOR={FILTER_OPERATOR}
                RulesDataSource={RulesDataSource}
                RulesDataSourceRepository={RulesDataSourceRepository}
                OutputsDataSource={OutputsDataSource}
                OutputsDataSourceRepository={OutputsDataSourceRepository}
                IntegrationsDataSource={IntegrationsDataSource}
                IntegrationsDataSourceRepository={
                  IntegrationsDataSourceRepository
                }
                useDocViewer={useDocViewer}
                DocViewer={DocViewer}
                DocumentViewTableAndJson={DocumentViewTableAndJson}
                useForm={useForm}
                InputForm={InputForm}
                GenericRequest={GenericRequest}
                TableWzAPI={TableWzAPI}
                WzRequest={WzRequest}
                WzListEditor={WzListEditor}
                WzDecoderInfo={WzDecoderInfo}
                {...props}
              />
            );
          }}
        ></Route>
        <Redirect from='/' to={getWzMainParams()} />
      </Switch>
    </Router>
  );
}
