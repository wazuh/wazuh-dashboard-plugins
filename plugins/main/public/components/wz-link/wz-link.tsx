import React, { useEffect, useState } from 'react';
import { RedirectAppLinks } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { EuiLink } from '@elastic/eui';
import { getCore } from '../../kibana-services';
import NavigationService from '../../react-services/navigation-service';
import useObservable from 'react-use/lib/useObservable';

type tWzLinkProps = {
  appId: string;
  path: string;
  children: React.ReactNode;
};

export const WzLink = (props: tWzLinkProps) => {
  const { appId, path } = props;

  const [isCurrentApp, setIsCurrentApp] = useState(false);

  useEffect(() => {
    const currentAppId$ = getCore().application.currentAppId$.subscribe(
      currentApp => {
        setIsCurrentApp(currentApp === appId);
      },
    );
    return () => {
      currentAppId$.unsubscribe();
    };
  }, []);

  const linkDiferentApps = (
    <RedirectAppLinks application={getCore().application}>
      <EuiLink
        {...props}
        href={NavigationService.getInstance().getUrlForApp(appId, {
          path: `#${path}`,
        })}
      >
        {props.children}
      </EuiLink>
    </RedirectAppLinks>
  );
  const linkSameApp = (
    <EuiLink
      {...props}
      onClick={() => {
        NavigationService.getInstance().navigate(path);
      }}
    >
      {props.children}
    </EuiLink>
  );
  return isCurrentApp ? linkSameApp : linkDiferentApps;
};
