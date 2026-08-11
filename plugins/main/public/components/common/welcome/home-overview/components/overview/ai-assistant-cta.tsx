import React from 'react';
import { EuiCard, EuiIcon } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../../../../kibana-services';
import { getAiAssistantUrl } from '../../utils/navigation';

/**
 * Home overview entry point for the AI Assistant (CEO direction supersedes issue #8895 in the
 * `wazuh-ai-assistant` plugin: no dedicated AI-only nav section — surface the assistant from Home
 * instead). Same card pattern as `cloud-security-cards.tsx`'s `CloudSecurityCards`: an `EuiCard`
 * with an `href` wrapped in `RedirectAppLinks`, which intercepts the click and routes it through
 * `core.application.navigateToApp` instead of a full page reload — the standard way this page
 * already links to apps outside the current one (see also the Security analytics tiles, which
 * link to an entirely different plugin the same way).
 *
 * No data to fetch, unlike its sibling cards — this is a plain navigation entry point, not a
 * metric tile, so it renders unconditionally with no loading/error state of its own.
 */
export const AiAssistantCta: React.FC = () => (
  <RedirectAppLinks application={getCore().application}>
    <EuiCard
      layout='horizontal'
      icon={<EuiIcon size='xl' type='machineLearningApp' />}
      title={i18n.translate('wazuh.homeOverview.aiAssistantCard.title', {
        defaultMessage: 'AI Assistant',
      })}
      titleSize='xs'
      description={i18n.translate(
        'wazuh.homeOverview.aiAssistantCard.description',
        {
          defaultMessage:
            'Ask questions about your fleet, findings, and MITRE ATT&CK activity in natural language.',
        },
      )}
      href={getAiAssistantUrl()}
      data-test-subj='home-overview-ai-assistant-card'
    />
  </RedirectAppLinks>
);
