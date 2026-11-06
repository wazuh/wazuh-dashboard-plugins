import React from 'react';
import { EuiButton, EuiCode, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import useObservable from 'react-use/lib/useObservable';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../../kibana-services';
import {
  TAB_VIEW_NAME_DASHBOARD,
  TAB_VIEW_NAME_RESPONSES,
  WAZUH_ACTIVE_RESPONSES_PATTERN,
} from '../../../../../common/constants';
import { DOCS_PATHS } from '../../../../../common/services/docs-paths';
import { AboutFlyoutButton } from '../../../common/flyouts/about-flyout-button';
import {
  getCreateActiveResponseUrl,
  isActiveResponsesRegistered,
} from '../../../common/welcome/home-overview/utils/navigation';

const NO_APPLICATIONS: ReadonlyMap<string, unknown> = new Map();

/**
 * Link to the form that creates an active response. It lives in the Active Responses app of the
 * `wazuh-dashboard-notifications` plugin, so it renders nothing when that app is not registered.
 */
const CreateActiveResponseLink = () => {
  const applications = useObservable(
    getCore().application.applications$,
    NO_APPLICATIONS,
  );
  if (!isActiveResponsesRegistered(applications)) {
    return null;
  }
  return (
    <>
      <EuiSpacer size='m' />
      <RedirectAppLinks application={getCore().application}>
        <EuiButton
          size='s'
          iconType='plusInCircle'
          href={getCreateActiveResponseUrl()}
          data-test-subj='wzAboutIncidentResponseCreateLink'
        >
          {i18n.translate('wazuh.incidentResponse.aboutFlyout.createLink', {
            defaultMessage: 'Create active response',
          })}
        </EuiButton>
      </RedirectAppLinks>
    </>
  );
};

export const ButtonAboutIncidentResponse = () => (
  <AboutFlyoutButton
    title={i18n.translate('wazuh.incidentResponse.aboutFlyout.title', {
      defaultMessage: 'About Incident Response',
    })}
    testSubj='IncidentResponse'
    docsPath={DOCS_PATHS.incidentResponse}
    overview={
      <p>
        {i18n.translate('wazuh.incidentResponse.aboutFlyout.overview', {
          defaultMessage:
            'Incident Response reports the active responses that were triggered. An active response is an automatic action, such as blocking an IP address or stopping a process, that runs when a security finding meets the conditions you configured. This page only reports them. You create and manage the active responses in the Active Responses page.',
        })}
      </p>
    }
    terms={[
      {
        title: (
          <>
            {i18n.translate(
              'wazuh.incidentResponse.aboutFlyout.executableTerm',
              {
                defaultMessage: 'Executable',
              },
            )}{' '}
            <EuiCode>wazuh.active_response.executable</EuiCode>
          </>
        ),
        description: i18n.translate(
          'wazuh.incidentResponse.aboutFlyout.executableDescription',
          {
            defaultMessage:
              'The command or script that the active response runs on the agent.',
          },
        ),
      },
      {
        title: (
          <>
            {i18n.translate('wazuh.incidentResponse.aboutFlyout.locationTerm', {
              defaultMessage: 'Location',
            })}{' '}
            <EuiCode>wazuh.active_response.location</EuiCode>
          </>
        ),
        description: (
          <FormattedMessage
            id='wazuh.incidentResponse.aboutFlyout.locationDescription'
            defaultMessage='Where the executable runs. {local} is the agent that generated the finding. Other values are a specific agent ({definedAgent}) or every agent ({all}).'
            values={{
              local: <EuiCode>local</EuiCode>,
              definedAgent: <EuiCode>defined-agent</EuiCode>,
              all: <EuiCode>all</EuiCode>,
            }}
          />
        ),
      },
      {
        title: (
          <>
            {i18n.translate('wazuh.incidentResponse.aboutFlyout.typeTerm', {
              defaultMessage: 'Type',
            })}{' '}
            <EuiCode>wazuh.active_response.type</EuiCode>
          </>
        ),
        description: (
          <FormattedMessage
            id='wazuh.incidentResponse.aboutFlyout.typeDescription'
            defaultMessage='How the executable runs. {stateless} runs once and is not reverted. {stateful} runs and is reverted after a timeout.'
            values={{
              stateless: <EuiCode>stateless</EuiCode>,
              stateful: <EuiCode>stateful</EuiCode>,
            }}
          />
        ),
      },
    ]}
    indices={[
      {
        id: 'dashboard',
        tab: TAB_VIEW_NAME_DASHBOARD,
        patterns: [WAZUH_ACTIVE_RESPONSES_PATTERN],
      },
      {
        id: 'responses',
        tab: TAB_VIEW_NAME_RESPONSES,
        patterns: [WAZUH_ACTIVE_RESPONSES_PATTERN],
      },
    ]}
    howToStart={
      <>
        <p>
          {i18n.translate('wazuh.incidentResponse.aboutFlyout.howToStart', {
            defaultMessage:
              'This page stays empty until an active response is triggered. Create the active responses you need, then come back to see their executions.',
          })}
        </p>
        <CreateActiveResponseLink />
      </>
    }
  />
);
