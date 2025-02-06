import { AppSetup } from './types';

export function appSetup({ registerApp }: AppSetup) {
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
}
