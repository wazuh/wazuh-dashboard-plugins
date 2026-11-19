import React from 'react';
import moment from 'moment';
import { i18n } from '@osd/i18n';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { formatUIDate } from '../../../../../../react-services/time-service';
import {
  CASE_PRIORITY_OPTIONS,
  CASE_STATUS_OPTIONS,
} from '../../../../document-details/case-management/case-options';
import {
  ActionList,
  ActionListItem,
  EmptyState,
  SeverityDistributionBar,
  StatTileGroup,
  StatTileSpec,
  WidgetGroup,
  WIDGET_LOADING_MIN_HEIGHT,
} from '../common';
import { useCaseManagementOverview } from '../../hooks/use-overview-data';
import {
  getCaseManagementCasesUrl,
  getCaseManagementUrl,
} from '../../utils/navigation';
import {
  CASE_SEVERITY_FIELD,
  CASE_STATUS_FIELD,
  CASE_STATUSES,
  OPEN_CASE_STATUSES,
} from '../../lib/fields';
import { ATTENTION_CASES_QUERY } from '../../lib/queries';
import { ACTION_LIST_ROWS, NON_TITLE_LINK_STYLE } from '../../lib/constants';
import { formatHomeNumber } from '../../lib/format-number';
import { SEVERITY_PRESENTATION } from '../../lib/severity-presentation';
import {
  HOME_OVERVIEW_COLOR,
  HOME_OVERVIEW_TEXT_COLOR,
} from '../../lib/theme-colors';
import { CaseSummary } from '../../interfaces/types';
import { DataGroupResult } from '../../interfaces/data-group';

type CaseStatusKey = (typeof CASE_STATUSES)[number];

/** Priority, then when the case last changed. */
const caseDetails = (item: CaseSummary) => {
  const priority = CASE_PRIORITY_OPTIONS.find(
    option => option.value === item.priority,
  )?.text;
  return (
    <EuiFlexGroup gutterSize='m' alignItems='center' responsive={false}>
      <EuiFlexItem grow={false}>
        <EuiText
          size='xs'
          color={item.priority === 'urgent' ? undefined : 'subdued'}
          style={
            item.priority === 'urgent'
              ? { color: HOME_OVERVIEW_TEXT_COLOR.danger }
              : undefined
          }
        >
          {priority ??
            i18n.translate('wazuh.common.homeOverviewCases.noPriority', {
              defaultMessage: 'No priority',
            })}
        </EuiText>
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ minWidth: 76, textAlign: 'right' }}>
        {item.updatedAt ? (
          <EuiToolTip content={formatUIDate(item.updatedAt)}>
            <EuiText size='xs' color='subdued'>
              {moment(item.updatedAt).fromNow()}
            </EuiText>
          </EuiToolTip>
        ) : (
          <EuiText size='xs' color='subdued'>
            -
          </EuiText>
        )}
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export interface CaseManagementCardProps {
  cases: ReturnType<typeof useCaseManagementOverview>;
}

/** Cases (current state): counts per status, open cases by severity, and the ones to act on. */
export const CaseManagementCard: React.FC<CaseManagementCardProps> = ({
  cases,
}) => {
  const { data, indexPatternId } = cases;
  const casesUrl = (
    filters: Parameters<typeof getCaseManagementCasesUrl>[0],
  ): string => getCaseManagementCasesUrl(filters, indexPatternId);

  const tiles: Array<StatTileSpec<CaseStatusKey>> = CASE_STATUSES.map(
    status => ({
      key: status,
      label:
        CASE_STATUS_OPTIONS.find(option => option.value === status)?.text ??
        status,
      testSubj: `case-status-${status}`,
      onSelect: () => casesUrl([{ field: CASE_STATUS_FIELD, value: status }]),
    }),
  );
  const attentionItem = (item: CaseSummary): ActionListItem => {
    const severity = SEVERITY_PRESENTATION.find(p => p.band === item.severity);
    return {
      key: item.id,
      label:
        item.title ??
        i18n.translate('wazuh.common.homeOverviewCases.untitled', {
          defaultMessage: 'Untitled case',
        }),
      href: casesUrl([{ field: '_id', value: item.id }]),
      dot: {
        color: severity?.color ?? HOME_OVERVIEW_COLOR.disabled,
        label:
          severity?.label ??
          i18n.translate('wazuh.common.homeOverviewCases.noSeverity', {
            defaultMessage: 'No severity',
          }),
      },
      end: caseDetails(item),
    };
  };
  // A bar of zeros reads as data; with no open case, show the empty message.
  const hasOpenCases =
    data &&
    OPEN_CASE_STATUSES.some(
      status => (data.byStatus[status as CaseStatusKey] ?? 0) > 0,
    );

  return (
    <WidgetGroup
      status={cases.status}
      errorLabel={cases.error?.message}
      showManageIndexPatternsLink={
        cases.error?.kind === 'index-pattern-missing'
      }
      isPermissionDenied={cases.error?.kind === 'permission-denied'}
      title={i18n.translate(
        'wazuh.common.homeOverviewSection.caseManagementTitle',
        { defaultMessage: 'Case Management' },
      )}
      titleLink={{ href: getCaseManagementUrl() }}
      caption={i18n.translate(
        'wazuh.common.homeOverviewWidget.captionCurrentState',
        { defaultMessage: 'Current state' },
      )}
      loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
      data-test-subj='home-overview-case-management'
    >
      {data &&
        (data.total ? (
          <>
            <StatTileGroup
              tiles={tiles}
              results={
                Object.fromEntries(
                  CASE_STATUSES.map(status => [
                    status,
                    { status: 'available', data: data.byStatus[status] },
                  ]),
                ) as Record<CaseStatusKey, DataGroupResult<number | undefined>>
              }
            />
            <EuiSpacer size='m' />
            <SeverityDistributionBar
              counts={hasOpenCases ? data.openBySeverity : {}}
              headline={
                <EuiText size='xs'>
                  <strong>
                    {i18n.translate(
                      'wazuh.common.homeOverviewSection.openCasesBySeverity',
                      { defaultMessage: 'Open cases by severity' },
                    )}
                  </strong>
                </EuiText>
              }
              onSelect={band =>
                casesUrl([
                  { field: CASE_STATUS_FIELD, value: OPEN_CASE_STATUSES },
                  { field: CASE_SEVERITY_FIELD, value: band },
                ])
              }
              emptyMessage={i18n.translate(
                'wazuh.common.homeOverviewSection.noOpenCases',
                { defaultMessage: 'No open cases' },
              )}
              testSubjPrefix='open-cases-severity'
            />
            <EuiSpacer size='l' />
            <ActionList
              title={i18n.translate(
                'wazuh.common.homeOverviewCases.needsAttention',
                { defaultMessage: 'Needs attention' },
              )}
              titleTooltip={i18n.translate(
                'wazuh.common.homeOverviewCases.needsAttentionTooltip',
                {
                  defaultMessage:
                    'Open cases that are urgent or critical, most urgent first.',
                },
              )}
              action={
                data.attention.total ? (
                  <EuiText size='xs'>
                    <RedirectAppLinks application={getCore().application}>
                      <EuiLink
                        href={getCaseManagementCasesUrl(
                          [
                            {
                              field: CASE_STATUS_FIELD,
                              value: OPEN_CASE_STATUSES,
                            },
                          ],
                          indexPatternId,
                          ATTENTION_CASES_QUERY,
                        )}
                        style={NON_TITLE_LINK_STYLE}
                        data-test-subj='case-management-attention-all'
                      >
                        {i18n.translate(
                          'wazuh.common.homeOverviewCases.viewAll',
                          {
                            defaultMessage: 'View all {count}',
                            values: {
                              count: formatHomeNumber(data.attention.total),
                            },
                          },
                        )}
                      </EuiLink>
                    </RedirectAppLinks>
                  </EuiText>
                ) : undefined
              }
              items={data.attention.cases.map(attentionItem)}
              slots={ACTION_LIST_ROWS}
              emptyMessage={i18n.translate(
                'wazuh.common.homeOverviewCases.noAttention',
                { defaultMessage: 'No urgent or critical case is open' },
              )}
              emptyIconType='checkInCircleFilled'
              data-test-subj='case-management-attention'
            />
          </>
        ) : (
          <EmptyState
            message={i18n.translate(
              'wazuh.common.homeOverviewSection.noCases',
              {
                defaultMessage:
                  'No cases yet. Open a finding and create one from its Case tab.',
              },
            )}
            minHeight={WIDGET_LOADING_MIN_HEIGHT.heroAndList}
            data-test-subj='case-management-empty'
          />
        ))}
    </WidgetGroup>
  );
};
