import React, { useEffect, useState } from 'react';
import {
  getAngularModule,
  getDataPlugin,
  getUiSettings,
} from '../../kibana-services';
import { Stats } from '../../controllers/overview/components/stats';
import { AppState, WzRequest } from '../../react-services';
import { OverviewWelcome } from '../common/welcome/overview-welcome';
import { MainModule } from '../common/modules/main';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { WzCurrentOverviewSectionWrapper } from '../common/modules/overview-current-section-wrapper';
import { createHashHistory } from 'history';
import {
  connectToQueryState,
  opensearchFilters,
  syncQueryStateWithUrl,
} from '../../../../../src/plugins/data/public';
import { once } from 'lodash';
import {
  createOsdUrlStateStorage,
  createStateContainer,
  syncState,
} from '../../../../../src/plugins/opensearch_dashboards_utils/public';

export const Overview: React.FC = () => {
  const [agentsCounts, setAgentsCounts] = useState({});
  const [tabActive, setTabActive] = useState('welcome');
  const [tabViewActive, setTabViewActive] = useState('panels');
  const [agentSelected, setAgentSelected] = useState({});
  const $location = getAngularModule().$injector.get('$location');
  const $route = getAngularModule().$injector.get('$route');

  useEffect(() => {
    const tab = $location.search().tab;
    const tabView = $location.search().tabView;
    setTabActive(tab || 'welcome');
    setTabViewActive(tabView || 'panels');
    if (tab === 'welcome' || tab === undefined) {
      getSummary();
    }
  }, []);

  useEffect(() => {
    const data = getDataPlugin();
    const config = getUiSettings();
    const getHistory = once(() => createHashHistory());
    const osdUrlStateStorage = createOsdUrlStateStorage({
      useHash: config.get('state:storeInSessionStorage'),
      history: getHistory(),
    });

    const appStateFromUrl = osdUrlStateStorage.get('_a') as AppState;
    let initialAppState = {
      ...data.query.queryString.getDefaultQuery(),
      ...appStateFromUrl,
    };
    let previousAppState: AppState;
    const appStateContainer = createStateContainer<AppState>(initialAppState);
    const appStateContainerModified = {
      ...appStateContainer,
      set: (value: AppState | null) => {
        if (value) {
          previousAppState = appStateContainer.getState();
          appStateContainer.set(value);
        }
      },
    };

    const replaceUrlAppState = async (newPartial: AppState = {}) => {
      const state = { ...appStateContainer.getState(), ...newPartial };
      await osdUrlStateStorage.set('_a', state, { replace: true });
    };

    const { start, stop } = syncState({
      storageKey: '_a',
      stateContainer: appStateContainerModified,
      stateStorage: osdUrlStateStorage,
    });

    const stopSyncingQueryAppStateWithStateContainer = connectToQueryState(
      data.query,
      appStateContainer,
      {
        filters: opensearchFilters.FilterStateStore.APP_STATE,
        query: true,
      },
    );

    const { stop: stopSyncingGlobalStateWithUrl } = syncQueryStateWithUrl(
      data.query,
      osdUrlStateStorage,
    );

    replaceUrlAppState().then(() => start());

    return () => {
      stop();
      stopSyncingGlobalStateWithUrl();
      stopSyncingQueryAppStateWithStateContainer();
    };
  }, []);

  /**
   * This fetch de agents summary
   */
  const getSummary = async () => {
    try {
      const {
        data: {
          data: { connection: data },
        },
      } = await WzRequest.apiReq('GET', '/agents/summary/status', {});
      setAgentsCounts(data);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  function switchTab(newTab: any, force: any) {
    try {
      if (tabActive === newTab && !force) {
        return;
      }
      setTabActive(newTab);
    } catch (error) {
      const options = {
        context: `${Overview.name}.switchTab`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
  }

  const switchSubTab = (subTab: string) => {
    try {
      if (tabViewActive !== subTab) {
        setTabViewActive(subTab);
      }
    } catch (error) {
      const options = {
        context: `${Overview.name}.switchSubtab`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
  };

  const updateSelectedAgents = (agentList: Array<any>) => {
    try {
      if (agentList.length > 0) {
        if ($location.search().agentId !== agentList[0]) {
          setAgentSelected(agentList[0]);
          $location.search('agentId', agentList[0]);
          $route.reload();
        }
      } else {
        setAgentSelected('');
        $location.search('agentId', null);
        $route.reload();
      }
    } catch (error) {
      const options = {
        context: `${Overview.name}.updateSelectedAgents`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
  };

  return (
    <>
      {tabActive && tabActive !== 'welcome' && (
        <>
          <MainModule
            section={tabActive}
            agentsSelectionProps={{
              tab: tabActive,
              subtab: tabViewActive,
              setAgent: (agentList: Array<any>) =>
                updateSelectedAgents(agentList),
            }}
            switchSubTab={subTab => switchSubTab(subTab)}
          />
          <WzCurrentOverviewSectionWrapper
            switchTab={(tab, force) => switchTab(tab, force)}
            currentTab={tabActive}
          />
        </>
      )}
      {tabActive === 'welcome' && (
        <>
          <Stats {...agentsCounts} />
          <OverviewWelcome {...agentsCounts} />
        </>
      )}
    </>
  );
};
