import {
  EuiFlexItem,
  EuiLink,
  EuiStat,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import { useEffect, useState } from 'react';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { UI_COLOR_STATUS } from '../../../../../common/constants';
import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../../../../components/common/data-source/pattern/pattern-data-source-filter-manager';
import { getCore } from '../../../../kibana-services';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { getLast24HoursAlerts } from './last-alerts-service';

type SeverityLevelKey = 'low' | 'medium' | 'high' | 'critical';

export function LastAlertsStat({ severity }: { severity: SeverityLevelKey }) {
  const [countLastAlerts, setCountLastAlerts] = useState<number | null>(null);
  const [discoverLocation, setDiscoverLocation] = useState<string>('');
  const severityLabel = {
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

  const ruleLevelRange = severityLabel[severity].ruleLevelRange;
  const maxRuleLevel = ruleLevelRange.maxRuleLevel;
  const minRuleLevel = ruleLevelRange.minRuleLevel;

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
            [minRuleLevel, maxRuleLevel],
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

  return (
    <EuiFlexItem>
      <RedirectAppLinks application={getCore().application}>
        <EuiStat
          title={
            <EuiToolTip
              position='top'
              content={`Click to see rule.level ${
                maxRuleLevel
                  ? 'between ' + minRuleLevel + ' to ' + maxRuleLevel
                  : minRuleLevel + ' or higher'
              }`}
            >
              <EuiLink
                className='statWithLink'
                style={{
                  fontWeight: 'normal',
                  color: severityLabel[severity].color,
                }}
                href={discoverLocation}
              >
                {countLastAlerts ?? '-'}
              </EuiLink>
            </EuiToolTip>
          }
          description={`${severityLabel[severity].label} severity`}
          descriptionElement='h3'
          titleColor={severityLabel[severity].color}
          textAlign='center'
        />
        <EuiText
          size='s'
          style={{
            marginTop: '0.7vh',
          }}
        >
          {'Rule level ' +
            minRuleLevel +
            (maxRuleLevel ? ' to ' + maxRuleLevel : ' or higher')}
        </EuiText>
      </RedirectAppLinks>
    </EuiFlexItem>
  );
}
