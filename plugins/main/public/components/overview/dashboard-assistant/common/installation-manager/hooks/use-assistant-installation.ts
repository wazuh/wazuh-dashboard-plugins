import { useState, useCallback, useMemo } from 'react';
import { installDashboardAssistantUseCase } from '../application/install-dashboard-assistant';
import { InstallationManager } from '../infrastructure/installation-manager';
import type {
  InstallDashboardAssistantRequest,
  InstallationProgress,
} from '../domain/types';
import { InstallDashboardAssistantResponse } from '../domain/types';
import { ConnectorFactory } from '../../connector/application/factories/connector-factory';
import { modelProviderConfigs } from '../../../provider-model-config';

interface ModelFormData {
  model_provider: string;
  model_id: string;
  api_url: string;
  api_key: string;
  description?: string;
}

export function useAssistantInstallation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] =
    useState<InstallDashboardAssistantResponse | null>(null);
  const [modelData, setModelData] = useState<ModelFormData | null>(null);
  const [progress, setProgress] = useState<InstallationProgress | null>(null);

  // Create installation use case with real repositories
  const installUseCase = useMemo(() => {
    // Create installation manager with progress callback
    const installationManager = new InstallationManager(progressUpdate => {
      setProgress(progressUpdate);
    });

    return installDashboardAssistantUseCase(installationManager);
  }, []);

  const setModel = useCallback((data: ModelFormData) => {
    setModelData(data);
  }, []);

  const install = useCallback(async () => {
    if (!modelData) {
      setError('No model data provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create installation request from model data
      const request: InstallDashboardAssistantRequest = {
        clusterSettings: {
          mlCommonsAgentFrameworkEnabled: true,
          onlyRunOnMlNode: false,
          ragPipelineFeatureEnabled: true,
          trustedConnectorEndpointsRegex: ['.*'],
        },
        connector: {
          name: `${modelData.model_provider} Chat Connector`,
          description: `The connector to public ${modelData.model_provider} model service for ${modelData.model_id}`,
          endpoint: modelData.api_url,
          model_id: modelData.model_id,
          api_key: modelData.api_key,
          model_config: modelProviderConfigs.find(
            config => config.model_provider === modelData.model_provider,
          )!,
        },
        model: {
          name: modelData.model_provider,
          function_name: 'remote',
          description:
            modelData.description || `${modelData.model_provider} model`,
        },
        agent: {
          name: `${modelData.model_provider}_agent`,
          description: `Agent for ${modelData.model_provider}`,
        },
      };

      const response = await installUseCase(request);
      setResult(response);

      if (!response.success) {
        setError(response.message);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      // Create a failure response with current progress or empty progress
      const currentProgress = progress || {
        currentStep: 0,
        totalSteps: 6,
        steps: [],
        overallState: 'waiting' as any,
      };
      setResult(
        InstallDashboardAssistantResponse.failure(
          errorMessage,
          currentProgress,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [modelData, installUseCase]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setResult(null);
    setProgress(null);
  }, []);

  return {
    install,
    setModel,
    reset,
    isLoading,
    error,
    result,
    modelData,
    progress,
    isSuccess: result?.success || false,
  };
}
