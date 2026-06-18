import React from 'react';
import { createRoot } from 'react-dom/client';
import { CoreStart } from 'opensearch_dashboards/public';

export const registerHeaderNavControl = (
  coreStart: CoreStart,
  Components: React.ComponentType,
  params?: {},
) => {
  const isNewHomePageEnable = coreStart.uiSettings.get('home:useNewHomePage');

  coreStart.chrome.navControls[
    isNewHomePageEnable ? 'registerLeftBottom' : 'registerRight'
  ]({
    order: 100,
    mount: (el: HTMLElement) => {
      const root = createRoot(el);
      root.render(<Components {...params} />);

      return () => root.unmount();
    },
  });
};
