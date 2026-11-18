import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiLink, EuiSpacer } from '@elastic/eui';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  BarList,
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
import { ACTIVE_RESPONSE_EXECUTABLE_FIELD } from '../../lib/fields';
import { KPI_LINK_STYLE } from '../../lib/constants';

export interface IncidentResponseCardProps {
  incidentResponse: ReturnType<typeof useIncidentResponseOverview>;
}

/** Active responses of the last 24 hours: total and top commands. */
export const IncidentResponseCard: React.FC<IncidentResponseCardProps> = ({
  incidentResponse,
}) => {
  const { data, indexPatternId } = incidentResponse;

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
          <BarList
            title={i18n.translate(
              'wazuh.common.homeOverviewSection.topCommands',
              { defaultMessage: 'Top 5 commands executed' },
            )}
            items={data.topCommands}
            emptyMessage={i18n.translate(
              'wazuh.common.homeOverviewSection.noActiveResponses',
              { defaultMessage: 'No active responses ran in this period' },
            )}
            getHref={item =>
              getActiveResponseResponsesUrl(
                { field: ACTIVE_RESPONSE_EXECUTABLE_FIELD, value: item.key },
                indexPatternId,
              )
            }
            data-test-subj='incident-response-top-commands'
          />
        </>
      )}
    </WidgetGroup>
  );
};
