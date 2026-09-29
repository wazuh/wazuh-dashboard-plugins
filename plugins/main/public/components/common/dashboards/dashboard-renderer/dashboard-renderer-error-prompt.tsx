import React from 'react';
// @ts-ignore
import { EuiEmptyPrompt, EuiLink, EuiButton } from '@elastic/eui';
import { i18n } from '@osd/i18n';
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

export const DashboardRendererErrorPrompt: React.FC<
  DashboardRendererErrorPromptProps
> = ({
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
      {i18n.translate(
        'wazuh.common.dashboardRenderer.errorPrompt.manageDashboardsLink',
        {
          defaultMessage: 'Manage dashboards',
        },
      )}
    </EuiLink>
  );

  const getRetryButton = () => (
    <EuiButton
      onClick={onRetry}
      data-test-subj='retryBuildDashboardInput'
      color='primary'
      fill
    >
      {i18n.translate(
        'wazuh.common.dashboardRenderer.errorPrompt.retryButton',
        {
          defaultMessage: 'Retry',
        },
      )}
    </EuiButton>
  );

  const getErrorContent = () => {
    switch (errorType) {
      case 'error':
        return {
          iconType: 'alert' as const,
          title: i18n.translate(
            'wazuh.common.dashboardRenderer.errorPrompt.errorTitle',
            {
              defaultMessage: 'Failed to render the dashboard',
            },
          ),
          body: <p>{errorMessage}</p>,
          actions: onRetry ? getRetryButton() : undefined,
        };

      case 'empty':
        return {
          iconType: 'alert' as const,
          title: i18n.translate(
            'wazuh.common.dashboardRenderer.errorPrompt.emptyTitle',
            {
              defaultMessage: 'Dashboard Renderer Error',
            },
          ),
          body: <p>{errorMessage}</p>,
          actions: getDashboardManagementLink(),
        };

      case 'not_found':
        return {
          iconType: 'alert' as const,
          title: i18n.translate(
            'wazuh.common.dashboardRenderer.errorPrompt.notFoundTitle',
            {
              defaultMessage: 'Dashboard Not Found',
            },
          ),
          body: (
            <p>
              {dashboardId
                ? i18n.translate(
                    'wazuh.common.dashboardRenderer.errorPrompt.notFoundBody',
                    {
                      defaultMessage:
                        '{errorMessage} Dashboard [id: {dashboardId}] not found.',
                      values: {
                        errorMessage: errorMessage ?? '',
                        dashboardId:
                          (hasPinnedAgent && agentDashboardId) || dashboardId,
                      },
                    },
                  )
                : i18n.translate(
                    'wazuh.common.dashboardRenderer.errorPrompt.notFoundBodyNoId',
                    {
                      defaultMessage: '{errorMessage} Dashboard  not found.',
                      values: { errorMessage: errorMessage ?? '' },
                    },
                  )}
            </p>
          ),
          actions: getDashboardManagementLink(),
        };

      case 'plugin_unavailable':
        return {
          iconType: 'alert' as const,
          title: i18n.translate(
            'wazuh.common.dashboardRenderer.errorPrompt.pluginUnavailableTitle',
            { defaultMessage: 'Dashboard by-value renderer is unavailable' },
          ),
          body: (
            <p>
              {i18n.translate(
                'wazuh.common.dashboardRenderer.errorPrompt.pluginUnavailableBody',
                {
                  defaultMessage:
                    'Ensure the Dashboard plugin is started and supports by-value rendering.',
                },
              )}
            </p>
          ),
          actions: undefined,
        };

      default:
        return {
          iconType: 'alert' as const,
          title: i18n.translate(
            'wazuh.common.dashboardRenderer.errorPrompt.unknownTitle',
            {
              defaultMessage: 'Unknown Error',
            },
          ),
          body: (
            <p>
              {errorMessage ||
                i18n.translate(
                  'wazuh.common.dashboardRenderer.errorPrompt.unknownBody',
                  {
                    defaultMessage: 'An unexpected error occurred.',
                  },
                )}
            </p>
          ),
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
