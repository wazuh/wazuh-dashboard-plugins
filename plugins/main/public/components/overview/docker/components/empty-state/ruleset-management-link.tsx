import React from 'react';
import { EuiLink } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import useObservable from 'react-use/lib/useObservable';
import { getCore } from '../../../../../kibana-services';

/**
 * App id of Ruleset management > Overview (integrations), owned by the Ruleset management
 * dashboards plugin. Kept as a literal: a cross-plugin value import does not resolve in this
 * plugin's build.
 */
const RULESET_MANAGEMENT_APP_ID = 'sa-integrations';

const NO_APPLICATIONS: ReadonlyMap<string, unknown> = new Map();

interface RulesetManagementApplication {
  getUrlForApp: (appId: string) => string;
  navigateToApp: (appId: string) => unknown;
}

/**
 * The application service when Ruleset management is registered, `undefined` otherwise (the
 * plugin is optional, so the link is only offered when the app exists).
 */
export const useRulesetManagementApplication = ():
  | RulesetManagementApplication
  | undefined => {
  const application = getCore().application;
  const applications = useObservable(
    application.applications$,
    NO_APPLICATIONS,
  );

  return applications.has(RULESET_MANAGEMENT_APP_ID) ? application : undefined;
};

/** Link to Ruleset management > Overview, to check the integrations that generate findings. */
export const RulesetManagementLink = ({
  application,
}: {
  application: RulesetManagementApplication;
}) => (
  <EuiLink
    href={application.getUrlForApp(RULESET_MANAGEMENT_APP_ID)}
    onClick={(event: React.MouseEvent) => {
      event.preventDefault();
      application.navigateToApp(RULESET_MANAGEMENT_APP_ID);
    }}
    data-test-subj='wzDockerEmptyStateRulesetManagement'
  >
    {i18n.translate('wazuh.docker.emptyState.rulesetManagementLink', {
      defaultMessage: 'Ruleset management > Overview',
    })}
  </EuiLink>
);
