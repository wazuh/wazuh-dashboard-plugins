import React from 'react';
import ReactDOM from 'react-dom';
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
      ReactDOM.render(<Components {...params} />, el);

      return () => {
        ReactDOM.unmountComponentAtNode(el);
      };
    },
  });
};
