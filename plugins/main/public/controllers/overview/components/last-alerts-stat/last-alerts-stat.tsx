import React, { useState, useEffect, useMemo } from 'react';
import {
  EuiStat,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiLink,
  EuiToolTip,
  EuiText,
  EuiStatProps,
} from '@elastic/eui';
import { getLast24HoursAlerts } from './last-alerts-service';
import { UI_COLOR_STATUS } from '../../../../../common/constants';
import { getCore } from '../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../../react-services/error-management';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../../../../components/common/data-source/pattern/pattern-data-source-filter-manager';
import { formatUINumber } from '../../../../react-services/format-number';
import { compose } from 'redux';
import {
  withDataSource,
  withDataSourceFetchOnStart,
  withDataSourceInitiated,
  withDataSourceLoading,
} from '../../../../components/common/hocs';
import {
  AlertsDataSourceRepository,
  ThreatHuntingDataSource,
} from '../../../../components/common/data-source';
import { LoadingSearchbarProgress } from '../../../../components/common/loading-searchbar-progress/loading-searchbar-progress';

type SeverityKey = 'low' | 'medium' | 'high' | 'critical';

export const severities = {
  low: {
    label: 'Low',
    color: UI_COLOR_STATUS.success,
    ruleLevelRange: {
      minRuleLevel: 0,
      maxRuleLevel: 6,
    },
  },
  medium: {
    label: 'Medium',
    color: UI_COLOR_STATUS.info,
    ruleLevelRange: {
      minRuleLevel: 7,
      maxRuleLevel: 11,
    },
  },
  high: {
    label: 'High',
    color: UI_COLOR_STATUS.warning,
    ruleLevelRange: {
      minRuleLevel: 12,
      maxRuleLevel: 14,
    },
  },
  critical: {
    label: 'Critical',
    color: UI_COLOR_STATUS.danger,
    ruleLevelRange: {
      minRuleLevel: 15,
      maxRuleLevel: undefined,
    },
  },
} as const;

const discoverLocation = {
  app: 'data-explorer',
  basePath: 'discover',
};

export const LastAlertsSummaryBySeverity = compose(
  withDataSource({
    DataSource: ThreatHuntingDataSource,
    DataSourceRepositoryCreator: AlertsDataSourceRepository,
  }),
  withDataSourceLoading({
    isLoadingNameProp: 'dataSource.isLoading',
    LoadingComponent: LoadingSearchbarProgress,
  }),
  withDataSourceInitiated({
    dataSourceErrorNameProp: 'dataSource.error',
    dataSourceNameProp: 'dataSource.dataSource',
    isLoadingNameProp: 'dataSource.isLoading',
  }),
)(props => {
  return (
    <>
      <EuiFlexGroup wrap alignItems='center'>
        <EuiFlexItem>
          <LastAlertsCountBySeverity
            severity='critical'
            dataSource={props.dataSource}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <LastAlertsCountBySeverity
            severity='high'
            dataSource={props.dataSource}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <LastAlertsCountBySeverity
            severity='medium'
            dataSource={props.dataSource}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <LastAlertsCountBySeverity
            severity='low'
            dataSource={props.dataSource}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
});

export const LastAlertsCountBySeverity = withDataSourceFetchOnStart({
  nameProp: 'dataSource',
  mapRequestParams: ({ dataSource, dependencies }) => {
    const [, severityKey] = dependencies;
    const { ruleLevelRange } = severities[severityKey];

    return {
      filters: [
        ...dataSource.fetchFilters,
        PatternDataSourceFilterManager.createFilter(
          FILTER_OPERATOR.IS_BETWEEN,
          'rule.level',
          [ruleLevelRange.minRuleLevel, ruleLevelRange.maxRuleLevel],
          dataSource.dataSource.indexPattern.id,
        ),
      ],
      dateRange: {
        from: 'now-24h',
        to: 'now',
        format: 'epoch_millis',
      },
      pagination: {
        pageIndex: 0,
        pageSize: 1, // We only need the count, so we can limit the page size to 1
      },
    };
  },
  mapResponse: (response, props) => {
    return { total: response.hits.total };
  },
  mapFetchActionDependencies(props) {
    return [props.severity];
  },
})(
  ({
    severity: severityKey,
    hideBottomText,
    direction = 'row',
    textAlign = 'center',
    dataSource,
    dataSourceAction,
  }: {
    severity: SeverityKey;
    hideBottomText?: boolean;
    direction: 'row' | 'column';
    textAlign?: EuiStatProps['textAlign'];
    dataSource: any;
    dataSourceAction: any;
  }) => {
    const severity = severities[severityKey];
    const ruleLevelRange = severity.ruleLevelRange;
    const urlDiscover = useMemo(() => {
      const indexPatternId = dataSource.dataSource.indexPattern.id;
      const predefinedFilters =
        PatternDataSourceFilterManager.filtersToURLFormat([
          ...dataSource.fetchFilters,
          PatternDataSourceFilterManager.createFilter(
            FILTER_OPERATOR.IS_BETWEEN,
            'rule.level',
            [ruleLevelRange.minRuleLevel, ruleLevelRange.maxRuleLevel],
            indexPatternId,
          ),
        ]);

      return getCore().application.getUrlForApp(discoverLocation.app, {
        path: `${discoverLocation.basePath}#?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(indexPattern:'${indexPatternId}',view:discover))&_g=${predefinedFilters}&_q=(filters:!(),query:(language:kuery,query:''))`,
      });
    }, []);

    const { total } = dataSourceAction.data || {};

    const statDescription =
      direction === 'row' ? `${severity.label} severity` : '';
    const statValue =
      direction === 'row'
        ? `${total ?? '-'}`
        : ` ${total ?? '-'} ${severity.label}`;

    return (
      <RedirectAppLinks application={getCore().application}>
        <EuiStat
          title={
            <EuiToolTip
              position='top'
              content={`Click to see rule.level ${
                ruleLevelRange.maxRuleLevel
                  ? 'between ' +
                    ruleLevelRange.minRuleLevel +
                    ' to ' +
                    ruleLevelRange.maxRuleLevel
                  : ruleLevelRange.minRuleLevel + ' or higher'
              }`}
            >
              <EuiLink
                className='statWithLink'
                style={{
                  fontWeight: 'normal',
                  color: severity.color,
                }}
                href={urlDiscover}
              >
                {formatUINumber(statValue)}
              </EuiLink>
            </EuiToolTip>
          }
          description={statDescription}
          descriptionElement='h3'
          titleColor={severity.color}
          textAlign={textAlign}
        />
        {hideBottomText ? null : (
          <EuiText size='s' css='margin-top: 0.7vh'>
            {'Rule level ' +
              ruleLevelRange.minRuleLevel +
              (ruleLevelRange.maxRuleLevel
                ? ' to ' + ruleLevelRange.maxRuleLevel
                : ' or higher')}
          </EuiText>
        )}
      </RedirectAppLinks>
    );
  },
);

export function LastAlertsStat({
  severity: severityKey,
  hideBottomText,
  direction = 'row',
  textAlign = 'center',
}: {
  severity: SeverityKey;
  hideBottomText?: boolean;
  direction: 'row' | 'column';
  textAlign?: EuiStatProps['textAlign'];
}) {
  const [countLastAlerts, setCountLastAlerts] = useState<number | null>(null);
  const [discoverLocation, setDiscoverLocation] = useState<string>('');

  const severity = severities[severityKey];
  const ruleLevelRange = severity.ruleLevelRange;

  useEffect(() => {
    const getCountLastAlerts = async () => {
      try {
        const { indexPatternId, cluster, count } = await getLast24HoursAlerts(
          ruleLevelRange,
        );
        setCountLastAlerts(count);
        const core = getCore();

        let discoverLocation = {
          app: 'data-explorer',
          basePath: 'discover',
        };

        // add predefined filters with URL filter format
        const clusterNameFilter = PatternDataSourceFilterManager.createFilter(
          FILTER_OPERATOR.IS,
          cluster.field,
          cluster.name,
          indexPatternId,
        );
        const ruleLevelRangeFilter =
          PatternDataSourceFilterManager.createFilter(
            FILTER_OPERATOR.IS_BETWEEN,
            'rule.level',
            [ruleLevelRange.minRuleLevel, ruleLevelRange.maxRuleLevel],
            indexPatternId,
          );
        const predefinedFilters =
          PatternDataSourceFilterManager.filtersToURLFormat([
            clusterNameFilter,
            ruleLevelRangeFilter,
          ]);

        const destURL = core.application.getUrlForApp(discoverLocation.app, {
          path: `${discoverLocation.basePath}#?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(indexPattern:'${indexPatternId}',view:discover))&_g=${predefinedFilters}&_q=(filters:!(),query:(language:kuery,query:''))`,
        });
        setDiscoverLocation(destURL);
      } catch (error) {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching last alerts',
        });
        ErrorHandler.handleError(searchError);
      }
    };
    getCountLastAlerts();
  }, []);

  const statDescription =
    direction === 'row' ? `${severity.label} severity` : '';
  const statValue =
    direction === 'row'
      ? `${countLastAlerts ?? '-'}`
      : ` ${countLastAlerts ?? '-'} ${severity.label}`;

  return (
    <EuiFlexItem>
      <RedirectAppLinks application={getCore().application}>
        <EuiStat
          title={
            <EuiToolTip
              position='top'
              content={`Click to see rule.level ${
                ruleLevelRange.maxRuleLevel
                  ? 'between ' +
                    ruleLevelRange.minRuleLevel +
                    ' to ' +
                    ruleLevelRange.maxRuleLevel
                  : ruleLevelRange.minRuleLevel + ' or higher'
              }`}
            >
              <EuiLink
                className='statWithLink'
                style={{
                  fontWeight: 'normal',
                  color: severity.color,
                }}
                href={discoverLocation}
              >
                {formatUINumber(statValue)}
              </EuiLink>
            </EuiToolTip>
          }
          description={statDescription}
          descriptionElement='h3'
          titleColor={severity.color}
          textAlign={textAlign}
        />
        {hideBottomText ? null : (
          <EuiText size='s' css='margin-top: 0.7vh'>
            {'Rule level ' +
              ruleLevelRange.minRuleLevel +
              (ruleLevelRange.maxRuleLevel
                ? ' to ' + ruleLevelRange.maxRuleLevel
                : ' or higher')}
          </EuiText>
        )}
      </RedirectAppLinks>
    </EuiFlexItem>
  );
}
