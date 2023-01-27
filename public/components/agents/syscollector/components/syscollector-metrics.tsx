import React, { useState } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiLoadingSpinner,
  EuiIcon,
} from '@elastic/eui';
import mapValues from 'lodash';
import { useGenericRequest } from '../../../common/hooks/useGenericRequest';
import { formatUIDate } from '../../../../react-services/time-service';

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
    (mapValues.isEmpty(syscollector.data.hardware) ||
      mapValues.isEmpty(syscollector.data.os))
  ) {
    return (
      <EuiPanel paddingSize='s' style={{ margin: 16, textAlign: 'center' }}>
        <EuiIcon type='iInCircle' /> Not enough hardware or operating system
        information
      </EuiPanel>
    );
  }

  return (
    <EuiPanel paddingSize='s' style={{ margin: 16 }}>
      <EuiFlexGroup>
        <EuiFlexItem grow={false}>
          <EuiText>
            Cores:{' '}
            {syscollector.isLoading ? (
              <EuiLoadingSpinner size='s' />
            ) : syscollector.data.hardware.cpu?.cores ? (
              <strong>{syscollector.data.hardware.cpu.cores}</strong>
            ) : (
              <strong>-</strong>
            )}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText>
            Memory:{' '}
            {syscollector.isLoading ? (
              <EuiLoadingSpinner size='s' />
            ) : syscollector.data.hardware.ram?.total ? (
              <strong>
                {(syscollector.data.hardware.ram.total / 1024).toFixed(2)} MB
              </strong>
            ) : (
              <strong>-</strong>
            )}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText>
            Arch:{' '}
            {syscollector.isLoading ? (
              <EuiLoadingSpinner size='s' />
            ) : (
              <strong>{syscollector.data.os.architecture}</strong>
            )}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText>
            Operating system:{' '}
            {syscollector.isLoading ? (
              <EuiLoadingSpinner size='s' />
            ) : (
              <strong>
                {syscollector.data.os.os.name} {syscollector.data.os.os.version}
              </strong>
            )}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={true}>
          <EuiText>
            CPU:{' '}
            {syscollector.isLoading ? (
              <EuiLoadingSpinner size='s' />
            ) : syscollector.data.hardware.cpu?.name ? (
              <strong>{syscollector.data.hardware.cpu.name}</strong>
            ) : (
              <strong>-</strong>
            )}
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText>
            Last scan:{' '}
            {syscollector.isLoading ? (
              <EuiLoadingSpinner size='s' />
            ) : (
              <strong>
                {offsetTimestamp('', syscollector.data.os.scan.time)}
              </strong>
            )}
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
}
