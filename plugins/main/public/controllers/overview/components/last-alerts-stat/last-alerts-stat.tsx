import React, { useState, useEffect } from 'react';
import { EuiStat, EuiFlexItem, EuiLink, EuiToolTip } from '@elastic/eui';
import { getLast24HoursAlerts } from './last-alerts-service';
import { UI_COLOR_AGENT_STATUS } from '../../../../../common/constants';
import { getCore } from '../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';

export function LastAlertsStat() {
  const [countLastAlerts, setCountLastAlerts] = useState<number | null>(null);
  const [discoverLocation, setDiscoverLocation] = useState<string>('');

  useEffect(() => {
    const getCountLastAlerts = async () => {
      const count = await getLast24HoursAlerts();
      setCountLastAlerts(count);
      const urlSearchParams = new URLSearchParams(location.href);
      //`#/search?_a=(query:(language:kuery,query:'alert.id:%20"${urlSearchParams.get('alert.id')}"'))`
      const destURL = getCore().application.getUrlForApp('discover', {
        path: urlSearchParams,
      });
      setDiscoverLocation(destURL);
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
                {countLastAlerts || '-'}
              </EuiLink>
            </EuiToolTip>
          }
          description={`Last 24 hour alerts`}
          titleColor={UI_COLOR_AGENT_STATUS.active}
          textAlign='center'
        />
      </RedirectAppLinks>
    </EuiFlexItem>
  );
}
