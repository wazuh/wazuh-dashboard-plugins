import React from 'react';
// @ts-ignore
import { EuiEmptyPrompt, EuiLink, EuiButton } from '@elastic/eui';
import { getCore } from '../../../../kibana-services';

export type ErrorType = 'error' | 'empty' | 'not_found' | 'plugin_unavailable';

export interface DashboardRendererErrorPromptProps {
  className?: string;
  errorType: ErrorType;
  errorMessage: string;
  dashboardId?: string;
  agentDashboardId?: string;
  hasPinnedAgent?: boolean;
  onRetry?: () => void;
}

export const DashboardRendererErrorPrompt: React.FC<DashboardRendererErrorPromptProps> = ({
  className,
  errorType,
  errorMessage,
  dashboardId,
  agentDashboardId,
  hasPinnedAgent,
  onRetry,
}) => {
  const getDashboardManagementLink = () => (
    <EuiLink
      target='_blank'
      rel='noopener noreferrer'
      external={true}
      href={getCore().application.getUrlForApp('dashboards', {
        path: '#/list',
      })}
    >
      Manage dashboards
    </EuiLink>
  );

  const getRetryButton = () => (
    <EuiButton
      onClick={onRetry}
      data-test-subj="retryBuildDashboardInput"
      color="primary"
      fill
    >
      Retry
    </EuiButton>
  );

  const getDashboardSelectionMessage = () => {
    if (!dashboardId) return '';
    
    const messages = [
      dashboardId ? `id: ${dashboardId}` : null,
      hasPinnedAgent && agentDashboardId ? `agent dashboard id: ${agentDashboardId}` : null,
    ]
      .filter(Boolean)
      .join(' or ');
    
    return `[${messages}]`;
  };

  const getErrorContent = () => {
    switch (errorType) {
      case 'error':
        return {
          iconType: 'alert' as const,
          title: 'Failed to render the dashboard',
          body: <p>{errorMessage}</p>,
          actions: onRetry ? getRetryButton() : undefined,
        };

      case 'empty':
        return {
          iconType: 'alert' as const,
          title: 'Dashboard Renderer Error',
          body: <p>{errorMessage}</p>,
          actions: getDashboardManagementLink(),
        };

      case 'not_found':
        return {
          iconType: 'alert' as const,
          title: 'Dashboard Not Found',
          body: <p>{errorMessage} Dashboard {getDashboardSelectionMessage()} not found.</p>,
          actions: getDashboardManagementLink(),
        };

      case 'plugin_unavailable':
        return {
          iconType: 'alert' as const,
          title: 'Dashboard by-value renderer is unavailable',
          body: <p>Ensure the Dashboard plugin is started and supports by-value rendering.</p>,
          actions: undefined,
        };

      default:
        return {
          iconType: 'alert' as const,
          title: 'Unknown Error',
          body: <p>{errorMessage || 'An unexpected error occurred.'}</p>,
          actions: undefined,
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <div className={className}>
      <EuiEmptyPrompt
        iconType={errorContent.iconType}
        title={<h3>{errorContent.title}</h3>}
        body={errorContent.body}
        actions={errorContent.actions}
      />
    </div>
  );
};

export default DashboardRendererErrorPrompt;