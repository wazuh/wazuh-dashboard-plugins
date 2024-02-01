import React, { useState, useEffect } from 'react';
import { EuiStat, EuiFlexItem, EuiLink, EuiToolTip } from '@elastic/eui';
import { getLast24HoursAlerts } from './last-alerts-service';
import { UI_COLOR_AGENT_STATUS } from '../../../../../common/constants';
import { getCore } from '../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../../react-services/error-management';

export function LastAlertsStat() {
  const [countLastAlerts, setCountLastAlerts] = useState<number | null>(null);
  const [discoverLocation, setDiscoverLocation] = useState<string>('');

  useEffect(() => {
    const getCountLastAlerts = async () => {
      try {
        const { indexPatternName, cluster, count } =
          await getLast24HoursAlerts();
        setCountLastAlerts(count);

        // TODO: find a better way to get the query discover URL
        const destURL = getCore().application.getUrlForApp('data-explorer', {
          path: `discover#?_a=(discover:(columns:!(_source),isDirty:!f,sort:!()),metadata:(indexPattern:'${indexPatternName}',view:discover))&_g=(filters:!(('$state':(store:globalState),meta:(alias:!n,disabled:!f,index:'${indexPatternName}',key:${cluster.field},negate:!f,params:(query:${cluster.name}),type:phrase),query:(match_phrase:(${cluster.field}:${cluster.name})))),refreshInterval:(pause:!t,value:0),time:(from:now-24h,to:now))&_q=(filters:!(),query:(language:kuery,query:''))`,
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
            <EuiToolTip position='top' content={`See alerts`}>
              <EuiLink
                className='statWithLink'
                style={{ fontWeight: 'normal' }}
                href={discoverLocation}
              >
                {countLastAlerts ?? '-'}
              </EuiLink>
            </EuiToolTip>
          }
          description={`Last 24 hours alerts`}
          titleColor={UI_COLOR_AGENT_STATUS.active}
          textAlign='center'
        />
      </RedirectAppLinks>
    </EuiFlexItem>
  );
}
