import { AppMountParameters } from 'opensearch_dashboards/public';
import { setErrorOrchestrator } from '../../react-services/common-services';
import { AppState } from '../../react-services/app-state';
import { ErrorOrchestratorService } from '../../react-services/error-orchestrator/error-orchestrator.service';
import {
  setHttp,
  setScopedHistory,
  setCookies,
} from '../../kibana-services';

export default function wazuhAppRegisterConfig({ initializeInnerAngular, stateUpdater }) {
  const innerAngularName = 'app/wazuh';

  return {
    id: `wazuh`,
    title: 'Wazuh',
    mount: async (params: AppMountParameters) => {
      try {
        if (!initializeInnerAngular) {
          throw Error('Wazuh plugin method initializeInnerAngular is undefined');
        }

        // Update redux app state logos with the custom logos
        // if (logosInitialState?.logos) {
        //   store.dispatch(updateAppConfig(logosInitialState.logos));
        // }


        setScopedHistory(params.history);
        // Load application bundle
        const { renderApp } = await import('../../application');
        // Get start services as specified in kibana.json
        const [coreStart, depsStart] = await core.getStartServices();
        setErrorOrchestrator(ErrorOrchestratorService);
        setHttp(core.http);
        setCookies(new Cookies());
        if (!AppState.checkCookies() || params.history.parentHistory.action === 'PUSH') {
          window.location.reload();
        }
        await initializeInnerAngular();
        params.element.classList.add('dscAppWrapper', 'wz-app');
        const unmount = await renderApp(innerAngularName, params.element);
        stateUpdater.next(() => {
          return {
            status: 0,
            category: {
              id: 'wazuh',
              label: 'Wazuh',
              order: 0,
              // euiIconType: core.http.basePath.prepend(logosInitialState?.logos?.[SIDEBAR_LOGO] ? getAssetURL(logosInitialState?.logos?.[SIDEBAR_LOGO]) : getThemeAssetURL('icon.svg', UI_THEME)),
            }
          }
        })
        return () => {
          unmount();
        };
      } catch (error) {
        console.debug(error);
      }
    },
    updater$: stateUpdater
  }
}
