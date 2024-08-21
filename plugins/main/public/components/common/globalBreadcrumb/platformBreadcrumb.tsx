import { getCore, getWzCurrentAppID } from '../../../kibana-services';
import NavigationService from '../../../react-services/navigation-service';
import { endpointSummary } from '../../../utils/applications';

export const setBreadcrumbs = (breadcrumbs, router) => {
  if (breadcrumbs === '' || breadcrumbs === undefined) {
    return;
  }
  const breadcrumbsCustom = breadcrumbs
    ?.map(breadcrumb =>
      breadcrumb?.agent?.id
        ? {
            className:
              'euiLink euiLink--subdued osdBreadcrumbs wz-vertical-align-middle',
            onClick: ev => {
              ev.stopPropagation();
              if (getWzCurrentAppID() === endpointSummary.id) {
                NavigationService.getInstance().navigate(
                  `/agents?tab=welcome&agent=${breadcrumb.agent.id}`,
                );
              } else {
                NavigationService.getInstance().navigateToApp(
                  endpointSummary.id,
                  {
                    path: `#/agents?tab=welcome&agent=${breadcrumb.agent.id}`,
                  },
                );
              }
            },
            truncate: true,
            text: breadcrumb.agent.name,
          }
        : /*
          Some use cases cause get Breadcrumbs to have the agent property
          undefined. In this case a null is added and then with the filter it
          is filtered
        */
        typeof breadcrumb.agent !== 'undefined'
        ? null
        : {
            ...breadcrumb,
            className: 'osdBreadcrumbs',
          },
    )
    .filter(value => value);

  getCore().chrome.setBreadcrumbs(breadcrumbsCustom);

  return breadcrumbsCustom;
};
