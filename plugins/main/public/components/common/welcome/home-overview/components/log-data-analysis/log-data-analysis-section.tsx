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
import { withErrorBoundary } from '../../../../hocs/error-boundary/with-error-boundary';
import { webDocumentationLink } from '../../../../../../../common/services/web_documentation';
import { SectionHeader } from '../common';
import { getDecodersUrl, getRulesUrl } from '../../utils/navigation';

const LOG_DATA_COLLECTION_DOCS_PATH =
  'user-manual/capabilities/log-data-collection/index.html';

interface Stage {
  id: string;
  step: number;
  title: string;
  description: string;
  linkLabel: string;
  href: string;
  external?: boolean;
}

const LogDataAnalysisSectionComponent: React.FC = () => {
  const stages: Stage[] = [
    {
      id: 'collect',
      step: 1,
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
      step: 2,
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
      href: getDecodersUrl(),
    },
    {
      id: 'detect',
      step: 3,
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
      href: getRulesUrl(),
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
      <EuiFlexGroup wrap responsive={false}>
        {stages.map(stage => (
          <EuiFlexItem key={stage.id} data-test-subj={`log-stage-${stage.id}`}>
            <EuiPanel paddingSize='m'>
              <EuiTitle size='xs'>
                <h3>{`${stage.step}. ${stage.title}`}</h3>
              </EuiTitle>
              <EuiText size='s' color='subdued'>
                <p>{stage.description}</p>
              </EuiText>
              <EuiLink
                href={stage.href}
                {...(stage.external
                  ? { target: '_blank', external: true }
                  : {})}
              >
                {stage.linkLabel}
              </EuiLink>
            </EuiPanel>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </div>
  );
};

export const LogDataAnalysisSection: React.FC = React.memo(
  withErrorBoundary(LogDataAnalysisSectionComponent),
);
