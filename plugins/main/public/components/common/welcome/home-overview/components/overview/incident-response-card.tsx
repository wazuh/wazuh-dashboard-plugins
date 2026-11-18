import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiFlexGroup, EuiFlexItem, EuiLink, EuiSpacer } from '@elastic/eui';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  BarList,
  EmptyState,
  StatTile,
  TabNumber,
  WidgetGroup,
  WIDGET_LOADING_MIN_HEIGHT,
} from '../common';
import { useIncidentResponseOverview } from '../../hooks/use-overview-data';
import {
  getActiveResponseResponsesUrl,
  getActiveResponseUrl,
} from '../../utils/navigation';
import { ACTIVE_RESPONSE_NAME_FIELD, AGENT_NAME_FIELD } from '../../lib/fields';
import { KPI_LINK_STYLE } from '../../lib/constants';

/** The two lists sit side by side and stack when the card gets narrow. */
const LIST_MIN_WIDTH = 'min(220px, 100%)';

export interface IncidentResponseCardProps {
  incidentResponse: ReturnType<typeof useIncidentResponseOverview>;
}

/** Active responses of the last 24 hours: total, top responses and top agents. */
export const IncidentResponseCard: React.FC<IncidentResponseCardProps> = ({
  incidentResponse,
}) => {
  const { data, indexPatternId } = incidentResponse;
  const listHref = (field: string) => (item: { key: string }) =>
    getActiveResponseResponsesUrl({ field, value: item.key }, indexPatternId);

  return (
    <WidgetGroup
      status={incidentResponse.status}
      errorLabel={incidentResponse.error?.message}
      showManageIndexPatternsLink={
        incidentResponse.error?.kind === 'index-pattern-missing'
      }
      isPermissionDenied={incidentResponse.error?.kind === 'permission-denied'}
      title={i18n.translate(
        'wazuh.common.homeOverviewSection.incidentResponseTitle',
        { defaultMessage: 'Incident Response' },
      )}
      titleLink={{ href: getActiveResponseUrl() }}
      caption={i18n.translate(
        'wazuh.common.homeOverviewWidget.captionLast24Hours',
        { defaultMessage: 'Last 24 hours' },
      )}
      loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
      data-test-subj='home-overview-incident-response'
    >
      {data && (
        <>
          <StatTile
            textAlign='center'
            reverse
            value={
              <RedirectAppLinks application={getCore().application}>
                <EuiLink
                  style={KPI_LINK_STYLE}
                  href={getActiveResponseResponsesUrl()}
                  data-test-subj='incident-response-total-link'
                >
                  <TabNumber value={data.total} />
                </EuiLink>
              </RedirectAppLinks>
            }
            label={i18n.translate(
              'wazuh.common.homeOverviewSection.activeResponsesTriggered',
              { defaultMessage: 'Active responses triggered' },
            )}
            data-test-subj='incident-response-total'
          />
          <EuiSpacer size='m' />
          {data.total === 0 ? (
            <EmptyState
              message={i18n.translate(
                'wazuh.common.homeOverviewSection.noActiveResponses',
                { defaultMessage: 'No active responses ran in this period' },
              )}
              minHeight={WIDGET_LOADING_MIN_HEIGHT.list}
              data-test-subj='incident-response-empty'
            />
          ) : (
            <EuiFlexGroup wrap responsive={false} gutterSize='l'>
              <EuiFlexItem style={{ minWidth: LIST_MIN_WIDTH }}>
                <BarList
                  title={i18n.translate(
                    'wazuh.common.homeOverviewSection.topActiveResponses',
                    { defaultMessage: 'Top 5 active responses' },
                  )}
                  items={data.topResponses}
                  getHref={listHref(ACTIVE_RESPONSE_NAME_FIELD)}
                  data-test-subj='incident-response-top-responses'
                />
              </EuiFlexItem>
              <EuiFlexItem style={{ minWidth: LIST_MIN_WIDTH }}>
                <BarList
                  title={i18n.translate(
                    'wazuh.common.homeOverviewSection.topResponseAgents',
                    { defaultMessage: 'Top 5 agents' },
                  )}
                  items={data.topAgents}
                  getHref={listHref(AGENT_NAME_FIELD)}
                  data-test-subj='incident-response-top-agents'
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
        </>
      )}
    </WidgetGroup>
  );
};
