import React from 'react';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import {
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiLink,
  EuiSpacer,
  EuiToolTip,
} from '@elastic/eui';
import { getCore } from '../../../../../../kibana-services';
import { formatUIDate } from '../../../../../../react-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  CASE_PRIORITY_OPTIONS,
  CASE_STATUS_OPTIONS,
} from '../../../../document-details/case-management/case-options';
import {
  EmptyState,
  ListTitle,
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
import { NON_TITLE_LINK_STYLE, VALUE_PLACEHOLDER } from '../../lib/constants';
import { RecentCase } from '../../interfaces/types';
import { DataGroupResult } from '../../interfaces/data-group';

type CaseStatusKey = (typeof CASE_STATUSES)[number];

export interface CaseManagementCardProps {
  cases: ReturnType<typeof useCaseManagementOverview>;
}

const optionText = (
  options: ReadonlyArray<{ value: string; text: string }>,
  value?: string,
) =>
  (value && options.find(option => option.value === value)?.text) ||
  value ||
  VALUE_PLACEHOLDER;

/** Cases (current state): counts per status, open cases by severity, latest open cases. */
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
      label: optionText(CASE_STATUS_OPTIONS, status),
      testSubj: `case-status-${status}`,
      onSelect: () => casesUrl([{ field: CASE_STATUS_FIELD, value: status }]),
    }),
  );

  const columns: Array<EuiBasicTableColumn<RecentCase>> = [
    {
      field: 'priority',
      name: i18n.translate(
        'wazuh.common.homeOverviewSection.casePriorityColumn',
        { defaultMessage: 'Priority' },
      ),
      width: '90px',
      render: (priority?: string) =>
        optionText(CASE_PRIORITY_OPTIONS, priority),
    },
    {
      field: 'title',
      name: i18n.translate('wazuh.common.homeOverviewSection.caseTitleColumn', {
        defaultMessage: 'Case',
      }),
      truncateText: true,
      render: (title: string | undefined, item: RecentCase) => (
        <RedirectAppLinks
          application={getCore().application}
          className='eui-textTruncate'
        >
          <EuiLink
            style={NON_TITLE_LINK_STYLE}
            href={casesUrl([{ field: '_id', value: item.id }])}
            title={title}
          >
            {title || VALUE_PLACEHOLDER}
          </EuiLink>
        </RedirectAppLinks>
      ),
    },
    {
      field: 'status',
      name: i18n.translate(
        'wazuh.common.homeOverviewSection.caseStatusColumn',
        { defaultMessage: 'Status' },
      ),
      width: '120px',
      render: (status?: string) => optionText(CASE_STATUS_OPTIONS, status),
    },
    {
      field: 'updatedAt',
      name: i18n.translate(
        'wazuh.common.homeOverviewSection.caseUpdatedColumn',
        { defaultMessage: 'Updated' },
      ),
      width: '130px',
      render: (updatedAt?: string) =>
        updatedAt ? (
          <EuiToolTip content={formatUIDate(updatedAt)}>
            <span>{moment(updatedAt).fromNow()}</span>
          </EuiToolTip>
        ) : (
          VALUE_PLACEHOLDER
        ),
    },
  ];

  const hasCases =
    data && CASE_STATUSES.some(status => (data.byStatus[status] ?? 0) > 0);
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
        (hasCases ? (
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
            {data.recentOpen.length > 0 && (
              <>
                <EuiSpacer size='m' />
                <ListTitle>
                  {i18n.translate(
                    'wazuh.common.homeOverviewSection.latestOpenCases',
                    { defaultMessage: 'Latest updated open cases' },
                  )}
                </ListTitle>
                <EuiBasicTable
                  items={data.recentOpen}
                  columns={columns}
                  tableLayout='fixed'
                  data-test-subj='latest-open-cases'
                />
              </>
            )}
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
