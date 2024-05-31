import React, { useState, useEffect } from 'react';
import {
  EuiStat,
  EuiFlexItem,
  EuiLink,
  EuiToolTip,
  EuiText,
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

export function LastAlertsStat({ severity }: { severity: string }) {
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
      },
    },
  };

  useEffect(() => {
    const getCountLastAlerts = async () => {
      try {
        const { indexPatternName, cluster, count } = await getLast24HoursAlerts(
          severityLabel[severity].ruleLevelRange,
        );
        setCountLastAlerts(count);
        const core = getCore();

        let discoverLocation = {
          app: 'data-explorer',
          basePath: 'discover',
        };

        // TODO: find a better way to get the query discover URL
        const destURL = core.application.getUrlForApp(discoverLocation.app, {
          path: `${
            discoverLocation.basePath
          }#?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(indexPattern:'${indexPatternName}',view:discover))&_g=(filters:!(('$state':(store:globalState),meta:(alias:!n,disabled:!f,index:'${indexPatternName}',key:${
            cluster.field
          },negate:!f,params:(query:${
            cluster.name
          }),type:phrase),query:(match_phrase:(${cluster.field}:${
            cluster.name
          }))),('$state':(store:globalState),meta:(alias:!n,disabled:!f,index:'wazuh-alerts-*',key:rule.level,negate:!f,params:(gte:${
            severityLabel[severity].ruleLevelRange.minRuleLevel
          },lte:${
            severityLabel[severity].ruleLevelRange.maxRuleLevel || '!n'
          }),type:range),range:(rule.level:(gte:${
            severityLabel[severity].ruleLevelRange.minRuleLevel
          },lte:${
            severityLabel[severity].ruleLevelRange.maxRuleLevel || '!n'
          })))),refreshInterval:(pause:!t,value:0),time:(from:now-24h,to:now))&_q=(filters:!(),query:(language:kuery,query:''))`,
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
                severityLabel[severity].ruleLevelRange.maxRuleLevel
                  ? 'between ' +
                    severityLabel[severity].ruleLevelRange.minRuleLevel +
                    ' to ' +
                    severityLabel[severity].ruleLevelRange.maxRuleLevel
                  : severityLabel[severity].ruleLevelRange.minRuleLevel +
                    ' or higher'
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
        <EuiText size='xs' css='margin-top: 0.7vh'>
          {'Rule level ' +
            severityLabel[severity].ruleLevelRange.minRuleLevel +
            (severityLabel[severity].ruleLevelRange.maxRuleLevel
              ? ' to ' + severityLabel[severity].ruleLevelRange.maxRuleLevel
              : ' or higher')}
        </EuiText>
      </RedirectAppLinks>
    </EuiFlexItem>
  );
}
