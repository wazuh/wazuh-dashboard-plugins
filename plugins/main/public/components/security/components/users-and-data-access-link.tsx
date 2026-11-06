import React from 'react';
import { EuiLink } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import useObservable from 'react-use/lib/useObservable';
import { getCore } from '../../../kibana-services';

/**
 * App id of Indexer management > Users and data access, owned by the
 * `wazuh-security-dashboards-plugin` fork (`PLUGIN_NAME`). Kept as a literal: a cross-plugin value
 * import does not resolve in this plugin's build.
 */
const INDEXER_SECURITY_APP_ID = 'security-dashboards-plugin';

const NO_APPLICATIONS: ReadonlyMap<string, unknown> = new Map();

/**
 * Links to Indexer management > Users and data access, where the dashboard sign-in accounts
 * live. The app is not registered for users who can't manage indexer security, so it then
 * renders the name without a link. With multiple data sources enabled (off by default in Wazuh),
 * the app is registered for every user, and the link may open a page they can't use.
 */
export const UsersAndDataAccessLink = () => {
  const application = getCore().application;
  const applications = useObservable(
    application.applications$,
    NO_APPLICATIONS,
  );
  const appName = i18n.translate('wazuh.security.usersAndDataAccessLink.text', {
    defaultMessage: 'Users and data access',
  });

  if (!applications.has(INDEXER_SECURITY_APP_ID)) {
    return <>{appName}</>;
  }
  return (
    <EuiLink
      href={application.getUrlForApp(INDEXER_SECURITY_APP_ID)}
      onClick={(event: React.MouseEvent) => {
        event.preventDefault();
        application.navigateToApp(INDEXER_SECURITY_APP_ID);
      }}
      data-test-subj='wzUsersAndDataAccessLink'
    >
      {appName}
    </EuiLink>
  );
};
