import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { TopNavMenu } from './top-nav/top-nav-menu';
import { getTopNavConfig } from './top-nav/get-top-nav';
import DevToolsRequestStatusIndicator from './dev-tools-request-status-indicator';

interface DevToolsHeaderProps {
  useUpdatedUX: boolean;
  show: boolean;
  loading: boolean;
  status?: number;
  statusText?: string;
  durationMs?: number;
  ok?: boolean;
  onClickExport: () => void;
}

const DevToolsHeader = ({
  useUpdatedUX,
  show,
  loading,
  ok,
  status,
  statusText,
  durationMs,
  onClickExport,
}: DevToolsHeaderProps) => {
  return (
    <EuiFlexGroup gutterSize='none'>
      <EuiFlexItem>
        <TopNavMenu
          useUpdatedUX={useUpdatedUX}
          items={getTopNavConfig({
            useUpdatedUX,
            onClickExport,
          })}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <DevToolsRequestStatusIndicator
          show={show}
          loading={loading}
          ok={ok}
          status={status}
          statusText={statusText}
          durationMs={durationMs}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

export default DevToolsHeader;
