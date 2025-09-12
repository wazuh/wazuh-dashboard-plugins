import React from 'react';
import { EuiFlexGroup, EuiBadge, EuiLoadingSpinner } from '@elastic/eui';

interface DevToolsRequestStatusIndicatorProps {
  loading: boolean;
  show: boolean;
  status?: number;
  statusText?: string;
  durationMs?: number;
  ok?: boolean;
}

const DevToolsRequestStatusIndicator = ({
  loading,
  show,
  status,
  statusText,
  durationMs,
  ok,
}: DevToolsRequestStatusIndicatorProps) => {
  return (
    <EuiFlexGroup
      alignItems='center'
      justifyContent='flexEnd'
      gutterSize='none'
      style={{ gap: 8 }}
    >
      {loading ? (
        <EuiBadge color='hollow'>
          <EuiFlexGroup
            alignItems='center'
            gutterSize='none'
            style={{ gap: 6 }}
          >
            <EuiLoadingSpinner size='s' />
            Request in progress
          </EuiFlexGroup>
        </EuiBadge>
      ) : show ? (
        <>
          <EuiBadge color={ok ? 'success' : 'danger'}>
            {status
              ? `${status} - ${statusText || (ok ? 'OK' : 'ERROR')}`
              : ok
              ? 'OK'
              : 'ERROR'}
          </EuiBadge>
          {typeof durationMs !== 'undefined' && (
            <EuiBadge color='hollow'>
              {Math.max(0, Math.round(durationMs))} ms
            </EuiBadge>
          )}
        </>
      ) : null}
    </EuiFlexGroup>
  );
};

export default DevToolsRequestStatusIndicator;
