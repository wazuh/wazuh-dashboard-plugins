import React, { useEffect, useState } from 'react';
import { RedirectAppLinks } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { EuiLink, EuiToolTip, EuiToolTipProps } from '@elastic/eui';
import { getCore } from '../../kibana-services';
import NavigationService from '../../react-services/navigation-service';
import useObservable from 'react-use/lib/useObservable';

type tWzLinkProps = {
  appId: string;
  path: string;
  children: React.ReactNode;
  toolTipProps?: EuiToolTipProps;
};

export const WzLink = (props: tWzLinkProps) => {
  const { appId, path, children, toolTipProps, ...otherProps } = props;

  const [isCurrentApp, setIsCurrentApp] = useState(false);
  const currentAppId$ = useObservable(
    getCore().application.currentAppId$,
    undefined,
  );

  useEffect(() => {
    setIsCurrentApp(currentAppId$ === appId);
  }, [currentAppId$, appId]);

  const linkDiferentApps = (
    <RedirectAppLinks application={getCore().application}>
      <EuiLink
        {...otherProps}
        href={NavigationService.getInstance().getUrlForApp(appId, {
          path: `#${path}`,
        })}
      >
        {children}
      </EuiLink>
    </RedirectAppLinks>
  );

  const linkSameApp = (
    <EuiLink
      {...otherProps}
      onClick={() => {
        NavigationService.getInstance().navigate(path);
      }}
    >
      {children}
    </EuiLink>
  );

  const finalLink = isCurrentApp ? linkSameApp : linkDiferentApps;

  return toolTipProps ? (
    <EuiToolTip {...toolTipProps}>{finalLink}</EuiToolTip>
  ) : (
    finalLink
  );
};
