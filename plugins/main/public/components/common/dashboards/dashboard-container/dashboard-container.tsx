import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { getPlugins } from '../../../../kibana-services';
import { buildDashboardByValueInput, getFiltersParams } from './dashboard-container-service';
import { Status, DashboardByValueInput } from './types';

type DashboardContainerProps = {
  dashboardId: string;
  agentDashboardId?: string;
  hasPinnedAgent: boolean;
  className?: string;
  config: {
    dataSource: any;
  }
};

export const DashboardContainer: React.FC<DashboardContainerProps> = ({
  dashboardId,
  agentDashboardId,
  hasPinnedAgent,
  className,
  config
}) => {
  const DashboardContainerByValueRenderer =
    getPlugins()?.dashboard?.DashboardContainerByValueRenderer;

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [byValueInput, setByValueInput] = useState<DashboardByValueInput | null>(null);

  const buildDashboard = useCallback(async (isAgent: boolean) => {
    return await buildDashboardByValueInput(isAgent && agentDashboardId ? agentDashboardId : dashboardId); 
  }, [dashboardId, agentDashboardId]);

  const buildByValueInputHandler = useCallback(async () => {
    setStatus('validating');
    setError(null);
    setByValueInput(null);

    const result = await buildDashboard(hasPinnedAgent);
    
    if (result.success) {
      setByValueInput({
        ...result.byValueInput!
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

  if (status === 'validating' || status === 'idle') {
    return (
      <div className={className} style={{ padding: 16 }}>
        <h3 style={{ margin: 0 }}>Loading dashboard…</h3>
        <p style={{ color: '#69707d' }}>Please wait a few seconds.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={className} style={{ padding: 16 }}>
        <div
          role="alert"
          style={{
            border: '1px solid #c23b37',
            background: '#fbe9e7',
            color: '#5f1a16',
            padding: 12,
            borderRadius: 4,
            marginBottom: 12,
          }}
        >
          <strong>Failed to render the dashboard</strong>
          <p style={{ margin: '8px 0 0' }}>{error}</p>
        </div>
        <button onClick={buildByValueInputHandler} data-test-subj="retryBuildDashboardInput">
          Retry
        </button>
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <div className={className} style={{ padding: 16 }}>
        <h3 style={{ margin: 0 }}>Dashboard not found</h3>
        <p style={{ color: '#69707d' }}>Check the identifier or create a new dashboard.</p>
        <a href={'/app/dashboards#/list'} target="_self" style={{ display: 'inline-block', marginTop: 8 }}>
          Open Dashboards Management
        </a>
      </div>
    );
  }

  if (status === 'ready') {
    if (!DashboardContainerByValueRenderer) {
      return (
        <div className={className} style={{ padding: 16 }}>
          <div
            role="alert"
            style={{
              border: '1px solid #c23b37',
              background: '#fbe9e7',
              color: '#5f1a16',
              padding: 12,
              borderRadius: 4,
              marginBottom: 12,
            }}
          >
            <strong>Dashboard by-value renderer is unavailable</strong>
            <p style={{ margin: '8px 0 0' }}>
              Ensure the Dashboard plugin is started and supports by-value rendering.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className={className} style={{ padding: 0 }}>
        <DashboardContainerByValueRenderer input={{
          ...byValueInput,
          ...getFiltersParams(config),
        }} />
      </div>
    );
  }

  return null;
};

export default DashboardContainer;