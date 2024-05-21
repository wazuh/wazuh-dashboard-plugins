import { getCore } from '../../../kibana-services';
import { endpointSummary } from '../../../utils/applications';

export const setBreadcrumbs = (breadcrumbs, router) => {
  if (breadcrumbs === '' || breadcrumbs === undefined) {
    return;
  }
  const breadcrumbsCustom = breadcrumbs?.map(breadcrumb =>
    breadcrumb.agent
      ? {
          className:
            'euiLink euiLink--subdued osdBreadcrumbs wz-vertical-align-middle',
          onClick: ev => {
            ev.stopPropagation();
            getCore().application.navigateToApp(endpointSummary.id, {
              path: `#/agents?tab=welcome&agent=${breadcrumb.agent.id}`,
            });
            // TODO: Replace router with another mechanism that does not depend on Angular
            /* router.reload(); */
          },
          truncate: true,
          text: breadcrumb.agent.name,
        }
      : {
          ...breadcrumb,
          className: 'osdBreadcrumbs',
        },
  );

  getCore().chrome.setBreadcrumbs(breadcrumbsCustom);

  return breadcrumbsCustom;
};
