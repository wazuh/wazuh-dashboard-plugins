import React, { useState } from 'react';
import { EuiPanel, EuiIcon } from '@elastic/eui';
import _ from 'lodash';
import { useGenericRequest } from '../../../common/hooks/useGenericRequest';
import { formatUIDate } from '../../../../react-services/time-service';
import WzRibbon from '../../../common/ribbon/ribbon';
import {
  IRibbonItem,
  RibbonItemLabel,
} from '../../../common/ribbon/ribbon-item';

export function InventoryMetrics({ agent }) {
  const [params, setParams] = useState({});
  const offsetTimestamp = (text, time) => {
    try {
      return text + formatUIDate(time);
    } catch (error) {
      return time !== '-' ? `${text}${time} (UTC)` : time;
    }
  };
  const syscollector = useGenericRequest(
    'GET',
    `/api/syscollector/${agent.id}`,
    params,
    result => {
      return (result || {}).data || {};
    },
  );

  if (
    !syscollector.isLoading &&
    (_.isEmpty(syscollector.data.hardware) || _.isEmpty(syscollector.data.os))
  ) {
    return (
      <EuiPanel paddingSize='s' style={{ margin: 16, textAlign: 'center' }}>
        <EuiIcon type='iInCircle' /> Not enough hardware or operating system
        information
      </EuiPanel>
    );
  }

  const render = () => {
    const items: IRibbonItem[] = [
      {
        key: 'cores',
        label: 'Cores',
        value: syscollector?.data?.hardware?.cpu?.cores,
        isLoading: syscollector.isLoading,
        style: { maxWidth: 100 },
      },
      {
        key: 'memory',
        label: 'Memory',
        value: syscollector?.data?.hardware?.ram?.total
          ? `${(syscollector?.data?.hardware?.ram?.total / 1024).toFixed(2)} MB`
          : '-',
        isLoading: syscollector.isLoading,
        style: { maxWidth: 100 },
      },
      {
        key: 'arch',
        label: 'Arch',
        value: syscollector?.data?.os?.architecture,
        isLoading: syscollector.isLoading,
        style: { maxWidth: 100 },
      },
      {
        key: 'os',
        label: RibbonItemLabel.OPERATING_SYSTEM,
        value: syscollector?.data?.os,
        isLoading: syscollector.isLoading,
      },
      {
        key: 'cpu',
        label: 'CPU',
        value: syscollector?.data?.hardware?.cpu?.name,
        isLoading: syscollector.isLoading,
        style: { maxWidth: 180 },
      },
      {
        key: 'hostname',
        label: 'Host name',
        value: syscollector?.data?.os?.hostname,
        isLoading: syscollector.isLoading,
        style: { maxWidth: 100 },
      },
      {
        key: 'board-serial',
        label: 'Board serial',
        value: syscollector?.data?.hardware?.board_serial,
        isLoading: syscollector.isLoading,
        style: { maxWidth: 100 },
      },
      {
        key: 'last-scan',
        label: 'Last scan',
        value: syscollector?.data?.os?.scan?.time
          ? offsetTimestamp('', syscollector?.data?.os?.scan?.time)
          : '-',
        isLoading: syscollector.isLoading,
        style: { maxWidth: 180 },
      },
    ];

    return <WzRibbon data-test-subj='syscollector-metrics' items={items} />;
  };

  return render();
}
