import {
  setAgentManagement,
  setEnrollAgentManagement,
} from '../plugin-services';
import { AppSetup } from './types';

export function appSetup({
  registerApp,
  agentManagement,
  enrollmentAgentManagement,
}: AppSetup) {
  registerApp({
    id: 'wazuh-fleet',
    title: 'Fleet management',
    order: 1,
    mount: async (params: AppMountParameters) => {
      try {
        // Load application bundle
        const { renderApp } = await import('./render-app');

        params.element.classList.add('dscAppWrapper', 'wz-app');

        const unmount = await renderApp(params);

        return () => {
          unmount();
        };
      } catch (error) {
        console.debug(error);
      }
    },
    // category: Categories.find(
    //   ({ id: categoryID }) => categoryID === category,
    // ),
  });

  setAgentManagement(agentManagement);
  // TODO: This setter should be local to fleet management instead of using the related to the plugin itself. This approach was done because the integration of FleetManagement is using another setter from plugin-services.
  setEnrollAgentManagement(enrollmentAgentManagement);
}
