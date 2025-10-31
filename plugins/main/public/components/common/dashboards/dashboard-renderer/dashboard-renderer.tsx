import React, { useCallback, useEffect, useState } from 'react';
// @ts-ignore
import { EuiEmptyPrompt, EuiLoadingSpinner } from '@elastic/eui';
import { getPlugins } from '../../../../kibana-services';
import {
  buildDashboardByValueInput,
  getFiltersParams,
} from './dashboard-renderer-service';
import { Status, DashboardByValueInput } from './types';
import DashboardRendererErrorPrompt from './dashboard-renderer-error-prompt';

type DashboardRendererProps = {
  dashboardId: string;
  agentDashboardId?: string;
  hasPinnedAgent: boolean;
  className?: string;
  config: {
    dataSource: any;
  };
};

export const DashboardRenderer: React.FC<DashboardRendererProps> = ({
  dashboardId,
  agentDashboardId,
  hasPinnedAgent,
  className,
  config,
}) => {
  const DashboardContainerByValueRenderer =
    getPlugins()?.dashboard?.DashboardContainerByValueRenderer;

  const [status, setStatus] = useState<Status>('validating');
  const [error, setError] = useState<string | null>(null);
  const [byValueInput, setByValueInput] =
    useState<DashboardByValueInput | null>(null);

  const buildDashboard = useCallback(
    async (isAgent: boolean) => {
      return await buildDashboardByValueInput(
        isAgent && agentDashboardId ? agentDashboardId : dashboardId,
      );
    },
    [dashboardId, agentDashboardId],
  );

  const buildByValueInputHandler = useCallback(async () => {
    setStatus('validating');
    setError(null);
    setByValueInput(null);

    const result = await buildDashboard(hasPinnedAgent);

    if (result.success) {
      setByValueInput({
        ...result.byValueInput!,
      });
      setStatus(result.status);
    } else {
      setStatus(result.status);
      setError(result.error!);
    }
  }, [buildDashboard, hasPinnedAgent]);

  useEffect(() => {
    buildByValueInputHandler();
  }, [hasPinnedAgent, dashboardId, agentDashboardId]);

  if (status === 'validating') {
    return (
      <div className={className}>
        <EuiEmptyPrompt
          icon={<EuiLoadingSpinner size='xl' />}
          title={<h3>Loading dashboard…</h3>}
          body={<p>Please wait a few seconds.</p>}
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <DashboardRendererErrorPrompt
        className={className}
        errorType='error'
        errorMessage={error || 'Unknown error'}
        onRetry={buildByValueInputHandler}
      />
    );
  }

  if (status === 'empty') {
    return (
      <DashboardRendererErrorPrompt
        className={className}
        errorType='empty'
        errorMessage={error || 'Unknown error'}
        dashboardId={dashboardId}
        agentDashboardId={agentDashboardId}
        hasPinnedAgent={hasPinnedAgent}
      />
    );
  }

  if (status === 'not_found') {
    return (
      <DashboardRendererErrorPrompt
        className={className}
        errorType='not_found'
        errorMessage={error || 'Unknown error'}
        dashboardId={dashboardId}
        agentDashboardId={agentDashboardId}
        hasPinnedAgent={hasPinnedAgent}
      />
    );
  }

  if (status === 'ready') {
    if (!DashboardContainerByValueRenderer) {
      return (
        <DashboardRendererErrorPrompt
          className={className}
          errorType='plugin_unavailable'
          errorMessage='Ensure the Dashboard plugin is started and supports by-value rendering.'
        />
      );
    }

    return (
      <div className={className} style={{ padding: 0 }}>
        <DashboardContainerByValueRenderer
          input={{
            ...byValueInput,
            ...getFiltersParams(config),
          }}
        />
      </div>
    );
  }

  return null;
};

export default DashboardRenderer;
