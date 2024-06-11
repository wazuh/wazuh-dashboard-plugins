import React, { useEffect, useState } from 'react';
import { getDataPlugin, getUiSettings } from '../../kibana-services';
import { Stats } from '../../controllers/overview/components/stats';
import { AppState, WzRequest } from '../../react-services';
import { OverviewWelcome } from '../common/welcome/overview-welcome';
import { MainModule } from '../common/modules/main';
import { WzCurrentOverviewSectionWrapper } from '../common/modules/overview-current-section-wrapper';
import {
  connectToQueryState,
  opensearchFilters,
  syncQueryStateWithUrl,
} from '../../../../../src/plugins/data/public';
import {
  createOsdUrlStateStorage,
  createStateContainer,
  syncState,
} from '../../../../../src/plugins/opensearch_dashboards_utils/public';
import { PinnedAgentManager } from '../wz-agent-selector/wz-agent-selector-service';
import { withRouteResolvers } from '../common/hocs';
import {
  enableMenu,
  ip,
  nestedResolve,
  savedSearch,
} from '../../services/resolves';
import { useRouterSearch } from '../common/hooks';
import NavigationService from '../../react-services/navigation-service';

export const Overview: React.FC = withRouteResolvers({
  enableMenu,
  ip,
  nestedResolve,
  savedSearch,
})(() => {
  const [agentsCounts, setAgentsCounts] = useState<object>({});
  const { tab = 'welcome', tabView = 'dashboard' } = useRouterSearch();
  const navigationService = NavigationService.getInstance();
  const pinnedAgentManager = new PinnedAgentManager();

  useEffect(() => {
    pinnedAgentManager.syncPinnedAgentSources();
    if (tab === 'welcome' || tab === undefined) {
      getSummary();
    }

    // TODO: Analyze if this behavior should be added to Navigationsservice
    // This is the code to sync the state of the URL with the state of the app
    const data = getDataPlugin();
    const config = getUiSettings();
    const history = navigationService.getHistory();
    const osdUrlStateStorage = createOsdUrlStateStorage({
      useHash: config.get('state:storeInSessionStorage'),
      history: history,
    });

    const appStateFromUrl = osdUrlStateStorage.get('_a') as AppState;
    let initialAppState = {
      ...data.query.queryString.getDefaultQuery(),
      ...appStateFromUrl,
    };
    const appStateContainer = createStateContainer<AppState>(initialAppState);
    const appStateContainerModified = {
      ...appStateContainer,
      set: (value: AppState | null) => {
        if (value) {
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
    const urlSearchParams = new URLSearchParams(navigationService.getSearch());
    urlSearchParams.set('tab', newTab);
    navigationService.navigate(
      `${navigationService.getPathname()}?${urlSearchParams.toString()}`,
    );
  }

  const switchSubTab = (subTab: string) => {
    const urlSearchParams = new URLSearchParams(navigationService.getSearch());
    urlSearchParams.set('tabView', subTab);
    navigationService.navigate(
      `${navigationService.getPathname()}?${urlSearchParams.toString()}`,
    );
  };

  return (
    <>
      {tab && tab !== 'welcome' && (
        <>
          <MainModule
            section={tab}
            tabView={tabView}
            agentsSelectionProps={{
              tab: tab,
              subtab: tabView,
            }}
            switchSubTab={subTab => switchSubTab(subTab)}
          />
          <WzCurrentOverviewSectionWrapper
            switchTab={(tab, force) => switchTab(tab, force)}
            currentTab={tab}
          />
        </>
      )}
      {tab === 'welcome' && (
        <>
          <Stats {...agentsCounts} />
          <OverviewWelcome {...agentsCounts} />
        </>
      )}
    </>
  );
});
