import React from 'react';
import { i18n } from '@osd/i18n';
import useObservable from 'react-use/lib/useObservable';
import {
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { getCore } from '../../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  ActionList,
  ActionListItem,
  EmptyState,
  StatTileGroup,
  StatTileSpec,
  WidgetGroup,
  WidgetGroupBody,
  WIDGET_LOADING_MIN_HEIGHT,
} from '../common';
import {
  useFindingsOverview,
  useIncidentResponseOverview,
} from '../../hooks/use-overview-data';
import {
  getActiveResponseResponsesUrl,
  getActiveResponseUrl,
  getCreateActiveResponseUrl,
  getFindingsByRuleUrl,
  isActiveResponsesRegistered,
} from '../../utils/navigation';
import {
  computeResponseCoverage,
  ResponseCoverage,
  RuleGap,
} from '../../lib/response-coverage';
import { ACTION_LIST_ROWS } from '../../lib/constants';
import { formatHomeNumber, formatHomePercent } from '../../lib/format-number';
import { SEVERITY_PRESENTATION } from '../../lib/severity-presentation';
import {
  HOME_OVERVIEW_CHROME,
  HOME_OVERVIEW_COLOR,
  HOME_OVERVIEW_COLOR_TINT,
  HOME_OVERVIEW_TEXT_COLOR,
} from '../../lib/theme-colors';
import { DataGroupResult } from '../../interfaces/data-group';
import { AnsweredFindings } from '../../interfaces/types';

type TileKey = 'total' | 'unanswered';

const NO_APPLICATIONS: ReadonlyMap<string, unknown> = new Map();

/** Coverage at or above this reads green, below `COVERAGE_WARNING` red, amber between. */
const COVERAGE_SUCCESS = 0.8;
const COVERAGE_WARNING = 0.4;

const coverageColor = (ratio: number) =>
  ratio >= COVERAGE_SUCCESS
    ? HOME_OVERVIEW_TEXT_COLOR.success
    : ratio >= COVERAGE_WARNING
    ? HOME_OVERVIEW_TEXT_COLOR.warning
    : HOME_OVERVIEW_TEXT_COLOR.danger;

const levelPresentation = (level: string) =>
  SEVERITY_PRESENTATION.find(p => p.band === level);

/** Share of critical/high findings an active response answered, as a labeled bar. */
const CoverageBar: React.FC<{ coverage: ResponseCoverage }> = ({
  coverage,
}) => {
  const ratio = coverage.ratio ?? 0;
  const percent = formatHomePercent(ratio);
  return (
    <div data-test-subj='incident-response-coverage'>
      <EuiFlexGroup
        justifyContent='spaceBetween'
        alignItems='baseline'
        gutterSize='s'
        responsive={false}
      >
        <EuiFlexItem grow={false}>
          <EuiText size='xs'>
            <strong>
              {i18n.translate(
                'wazuh.common.homeOverviewIncidentResponse.coverageTitle',
                { defaultMessage: 'Response coverage' },
              )}
            </strong>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiToolTip
            content={i18n.translate(
              'wazuh.common.homeOverviewIncidentResponse.coverageTooltip',
              {
                defaultMessage:
                  '{answered} of {total} critical and high findings got an active response',
                values: {
                  answered: formatHomeNumber(coverage.answered),
                  total: formatHomeNumber(coverage.total),
                },
              },
            )}
          >
            <EuiText size='xs'>
              <strong
                className='tab-num'
                style={{ color: coverageColor(ratio) }}
                data-test-subj='incident-response-coverage-value'
              >
                {percent}
              </strong>
            </EuiText>
          </EuiToolTip>
        </EuiFlexItem>
      </EuiFlexGroup>
      <div
        role='img'
        aria-label={i18n.translate(
          'wazuh.common.homeOverviewIncidentResponse.coverageLabel',
          {
            defaultMessage: 'Response coverage {percent}',
            values: { percent },
          },
        )}
        style={{
          marginTop: 6,
          height: 8,
          borderRadius: 8,
          overflow: 'hidden',
          background: coverage.unanswered
            ? HOME_OVERVIEW_COLOR_TINT.danger
            : HOME_OVERVIEW_CHROME.trackBackground,
        }}
      >
        <div
          style={{
            width: `${ratio * 100}%`,
            height: '100%',
            background: HOME_OVERVIEW_COLOR.success,
          }}
        />
      </div>
    </div>
  );
};

const gapDetails = (gap: RuleGap) => {
  const unanswered = formatHomeNumber(gap.unanswered);
  const total = formatHomeNumber(gap.count);
  return (
    <EuiToolTip
      content={i18n.translate(
        'wazuh.common.homeOverviewIncidentResponse.gapTooltip',
        {
          defaultMessage:
            '{unanswered} of {total} findings of this rule got no active response',
          values: { unanswered, total },
        },
      )}
    >
      <EuiText size='xs' color='subdued' className='tab-num'>
        {gap.unanswered === gap.count
          ? i18n.translate(
              'wazuh.common.homeOverviewIncidentResponse.gapAllUnanswered',
              {
                defaultMessage: '{unanswered} unanswered',
                values: { unanswered },
              },
            )
          : i18n.translate(
              'wazuh.common.homeOverviewIncidentResponse.gapSomeUnanswered',
              {
                defaultMessage: '{unanswered} of {total} unanswered',
                values: { unanswered, total },
              },
            )}
      </EuiText>
    </EuiToolTip>
  );
};

/** "· 4 more", "· 4+ more" when the search left rules out, "· more may exist" with none shown. */
const moreRulesNote = (more: number, partial: boolean) => {
  if (more) {
    return partial
      ? i18n.translate(
          'wazuh.common.homeOverviewIncidentResponse.moreRulesPartial',
          {
            defaultMessage: '· {count}+ more',
            values: { count: formatHomeNumber(more) },
          },
        )
      : i18n.translate('wazuh.common.homeOverviewIncidentResponse.moreRules', {
          defaultMessage: '· {count} more',
          values: { count: formatHomeNumber(more) },
        });
  }
  return partial
    ? i18n.translate(
        'wazuh.common.homeOverviewIncidentResponse.moreRulesMayExist',
        { defaultMessage: '· more may exist' },
      )
    : undefined;
};

export interface IncidentResponseCardProps {
  incidentResponse: ReturnType<typeof useIncidentResponseOverview>;
  /** Home's findings search, which carries the critical/high findings and their rules. */
  findings: ReturnType<typeof useFindingsOverview>;
  /** Those findings an active response answered (`useAnsweredFindings`). */
  answeredFindings: DataGroupResult<AnsweredFindings>;
}

/**
 * Active responses of the last 24 hours against the critical/high findings they should answer:
 * how many ran, how many findings are left without one, and the rules behind them.
 */
export const IncidentResponseCard: React.FC<IncidentResponseCardProps> = ({
  incidentResponse,
  findings,
  answeredFindings,
}) => {
  const applications = useObservable(
    getCore().application.applications$,
    NO_APPLICATIONS,
  );
  const { data } = incidentResponse;
  // The coverage needs both searches; the first one not available stands for both.
  const pending = [findings, answeredFindings].find(
    group => group.status !== 'available',
  );
  const coverage =
    data && !pending && findings.data && answeredFindings.data
      ? computeResponseCoverage(
          findings.data.seriousFindings,
          answeredFindings.data,
        )
      : undefined;

  const tiles: Array<StatTileSpec<TileKey>> = [
    {
      key: 'total',
      label: i18n.translate(
        'wazuh.common.homeOverviewIncidentResponse.responsesTriggered',
        { defaultMessage: 'Responses triggered' },
      ),
      testSubj: 'incident-response-total',
      onSelect: () => getActiveResponseResponsesUrl(),
    },
    {
      key: 'unanswered',
      label: i18n.translate(
        'wazuh.common.homeOverviewIncidentResponse.unanswered',
        { defaultMessage: 'Critical and high findings left unanswered' },
      ),
      testSubj: 'incident-response-unanswered',
      color:
        coverage === undefined
          ? undefined
          : coverage.unanswered
          ? HOME_OVERVIEW_TEXT_COLOR.danger
          : HOME_OVERVIEW_TEXT_COLOR.success,
    },
  ];
  const results: Record<TileKey, DataGroupResult<number | undefined>> = {
    total: { status: 'available', data: data?.total },
    unanswered: coverage
      ? { status: 'available', data: coverage.unanswered }
      : { status: pending?.status ?? 'loading', error: pending?.error },
  };

  const gaps = coverage?.gaps ?? [];
  const moreGaps = Math.max(gaps.length - ACTION_LIST_ROWS, 0);
  const gapItems: ActionListItem[] = gaps.map(gap => {
    const level = levelPresentation(gap.level);
    return {
      key: gap.id,
      label: gap.title,
      href: getFindingsByRuleUrl(gap.id, gap.level, findings.indexPatternId),
      dot: {
        color: level?.color ?? HOME_OVERVIEW_COLOR.warning,
        label: level?.label ?? gap.level,
      },
      end: gapDetails(gap),
    };
  });

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
          <StatTileGroup tiles={tiles} results={results} />
          <EuiSpacer size='m' />
          {!coverage ? (
            <WidgetGroupBody
              status={pending?.status ?? 'loading'}
              errorLabel={pending?.error?.message}
              isPermissionDenied={pending?.error?.kind === 'permission-denied'}
              loadingMinHeight={WIDGET_LOADING_MIN_HEIGHT.list}
            >
              {null}
            </WidgetGroupBody>
          ) : coverage.total === 0 ? (
            <EmptyState
              message={i18n.translate(
                'wazuh.common.homeOverviewIncidentResponse.noSeriousFindings',
                {
                  defaultMessage: 'No critical or high findings in this period',
                },
              )}
              iconType='checkInCircleFilled'
              minHeight={WIDGET_LOADING_MIN_HEIGHT.list}
              data-test-subj='incident-response-no-serious-findings'
            />
          ) : (
            <>
              <CoverageBar coverage={coverage} />
              <EuiSpacer size='l' />
              <ActionList
                title={i18n.translate(
                  'wazuh.common.homeOverviewIncidentResponse.needsResponse',
                  { defaultMessage: 'Needs a response' },
                )}
                titleTooltip={i18n.translate(
                  'wazuh.common.homeOverviewIncidentResponse.needsResponseTooltip',
                  {
                    defaultMessage:
                      'Rules whose critical or high findings of the last 24 hours got no active response. Critical first.',
                  },
                )}
                titleNote={moreRulesNote(moreGaps, coverage.gapsPartial)}
                action={
                  isActiveResponsesRegistered(applications) && gaps.length ? (
                    <RedirectAppLinks application={getCore().application}>
                      <EuiButtonEmpty
                        size='xs'
                        flush='right'
                        iconType='plusInCircle'
                        href={getCreateActiveResponseUrl()}
                        data-test-subj='incident-response-create'
                      >
                        {i18n.translate(
                          'wazuh.common.homeOverviewIncidentResponse.createResponse',
                          { defaultMessage: 'Create active response' },
                        )}
                      </EuiButtonEmpty>
                    </RedirectAppLinks>
                  ) : undefined
                }
                items={gapItems}
                slots={ACTION_LIST_ROWS}
                emptyMessage={i18n.translate(
                  'wazuh.common.homeOverviewIncidentResponse.allAnswered',
                  {
                    defaultMessage:
                      'Every critical and high finding got a response',
                  },
                )}
                emptyIconType='checkInCircleFilled'
                data-test-subj='incident-response-gaps'
              />
            </>
          )}
        </>
      )}
    </WidgetGroup>
  );
};
