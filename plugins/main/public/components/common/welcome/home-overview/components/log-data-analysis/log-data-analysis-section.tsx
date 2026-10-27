import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiPanel,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import useObservable from 'react-use/lib/useObservable';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../../../../kibana-services';
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { SectionHeader } from '../common';
import {
  getDecodersUrl,
  getRulesUrl,
  isDecodersRegistered,
  isRulesRegistered,
} from '../../utils/navigation';

const NO_APPLICATIONS: ReadonlyMap<string, unknown> = new Map();

const LOG_DATA_COLLECTION_DOCS_PATH =
  'user-manual/capabilities/log-data-collection/index.html';

interface Stage {
  id: string;
  title: string;
  description: string;
  linkLabel: string;
  href?: string;
  external?: boolean;
}

const LogDataAnalysisSectionComponent: React.FC = () => {
  const applications = useObservable(
    getCore().application.applications$,
    NO_APPLICATIONS,
  );
  const stages: Stage[] = [
    {
      id: 'collect',
      title: i18n.translate(
        'wazuh.common.homeOverviewLogDataAnalysis.collectTitle',
        { defaultMessage: 'Collect' },
      ),
      description: i18n.translate(
        'wazuh.common.homeOverviewLogDataAnalysis.collectDescription',
        {
          defaultMessage:
            'Configure the agent to read the log file, so its events reach the platform.',
        },
      ),
      linkLabel: i18n.translate(
        'wazuh.common.homeOverviewLogDataAnalysis.collectLink',
        { defaultMessage: 'How to collect a log' },
      ),
      href: webDocumentationLink(LOG_DATA_COLLECTION_DOCS_PATH),
      external: true,
    },
    {
      id: 'decode',
      title: i18n.translate(
        'wazuh.common.homeOverviewLogDataAnalysis.decodeTitle',
        { defaultMessage: 'Decode' },
      ),
      description: i18n.translate(
        'wazuh.common.homeOverviewLogDataAnalysis.decodeDescription',
        {
          defaultMessage:
            'Decoders normalize each collected log into structured fields.',
        },
      ),
      linkLabel: i18n.translate(
        'wazuh.common.homeOverviewLogDataAnalysis.decodeLink',
        { defaultMessage: 'Open Decoders' },
      ),
      href: isDecodersRegistered(applications) ? getDecodersUrl() : undefined,
    },
    {
      id: 'detect',
      title: i18n.translate(
        'wazuh.common.homeOverviewLogDataAnalysis.detectTitle',
        { defaultMessage: 'Detect' },
      ),
      description: i18n.translate(
        'wazuh.common.homeOverviewLogDataAnalysis.detectDescription',
        {
          defaultMessage:
            'Rules match the decoded events and raise the findings you see on Home.',
        },
      ),
      linkLabel: i18n.translate(
        'wazuh.common.homeOverviewLogDataAnalysis.detectLink',
        { defaultMessage: 'Open Rules' },
      ),
      href: isRulesRegistered(applications) ? getRulesUrl() : undefined,
    },
  ];

  return (
    <div data-test-subj='home-overview-log-data-analysis'>
      <SectionHeader
        title={i18n.translate(
          'wazuh.common.homeOverviewLogDataAnalysis.title',
          { defaultMessage: 'Log data analysis' },
        )}
        description={i18n.translate(
          'wazuh.common.homeOverviewLogDataAnalysis.description',
          {
            defaultMessage:
              'How a log becomes a finding: collect it, decode it, then detect on it.',
          },
        )}
      />
      <RedirectAppLinks application={getCore().application}>
        <EuiFlexGroup wrap responsive={false}>
          {stages.map((stage, index) => (
            <EuiFlexItem
              key={stage.id}
              data-test-subj={`log-stage-${stage.id}`}
            >
              <EuiPanel paddingSize='m'>
                <EuiTitle size='xs'>
                  <h3>{`${index + 1}. ${stage.title}`}</h3>
                </EuiTitle>
                <EuiText size='s' color='subdued'>
                  <p>{stage.description}</p>
                </EuiText>
                {stage.href && (
                  <EuiLink
                    href={stage.href}
                    {...(stage.external
                      ? { target: '_blank', external: true }
                      : {})}
                  >
                    {stage.linkLabel}
                  </EuiLink>
                )}
              </EuiPanel>
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      </RedirectAppLinks>
    </div>
  );
};

export const LogDataAnalysisSection: React.FC = React.memo(
  withErrorBoundary(LogDataAnalysisSectionComponent),
);
