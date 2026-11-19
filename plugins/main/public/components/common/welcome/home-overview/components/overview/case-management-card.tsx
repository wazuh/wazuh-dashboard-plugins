import React from 'react';
import { i18n } from '@osd/i18n';
import { EuiSpacer } from '@elastic/eui';
import { CASE_STATUS_OPTIONS } from '../../../../document-details/case-management/case-options';
import {
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
import { DataGroupResult } from '../../interfaces/data-group';

type CaseStatusKey = (typeof CASE_STATUSES)[number];

export interface CaseManagementCardProps {
  cases: ReturnType<typeof useCaseManagementOverview>;
}

/** Cases (current state): counts per status and open cases by severity. */
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
      centerBody
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
              headline={i18n.translate(
                'wazuh.common.homeOverviewSection.openCasesBySeverity',
                { defaultMessage: 'Open cases by severity' },
              )}
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
