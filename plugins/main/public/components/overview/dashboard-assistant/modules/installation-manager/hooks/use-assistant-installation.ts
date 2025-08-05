import { useState, useCallback, useMemo } from 'react';
import { installDashboardAssistantUseCase } from '../application/install-dashboard-assistant';
import { InstallationManager } from '../infrastructure/installation-manager';
import type {
  InstallDashboardAssistantRequest,
  InstallationProgress,
} from '../domain/types';
import { InstallDashboardAssistantResponse } from '../domain/types';
import { ConnectorFactory } from '../../../modules/connector/application/factories/connector-factory';
import { modelProviderConfigs } from '../../../provider-model-config';

interface ModelConfiguration {
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
  const [assistantModelInfo, setAssistantModelInfo] =
    useState<ModelConfiguration | null>(null);
  const [progress, setProgress] = useState<InstallationProgress | null>(null);

  // Create installation use case with real repositories
  const installUseCase = useMemo(() => {
    // Create installation manager with progress callback
    const installationManager = new InstallationManager(progressUpdate => {
      setProgress(progressUpdate);
    });

    return installDashboardAssistantUseCase(installationManager);
  }, []);

  const setModel = useCallback((data: ModelConfiguration) => {
    setAssistantModelInfo(data);
  }, []);

  const install = useCallback(async () => {
    if (!assistantModelInfo) {
      setError('No model data provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create installation request from model data
      const request: InstallDashboardAssistantRequest = {
        selected_provider: assistantModelInfo.model_provider,
        ml_common_settings: {
          trusted_connector_endpoints_regex: ['.*'],
        },
        connector: {
          name: `${assistantModelInfo.model_provider} Chat Connector`,
          description: `Connector to ${assistantModelInfo.model_provider} model service for ${assistantModelInfo.model_id}`,
          endpoint: assistantModelInfo.api_url,
          model_id: assistantModelInfo.model_id,
          api_key: assistantModelInfo.api_key,
          model_config: modelProviderConfigs.find(
            config =>
              config.model_provider === assistantModelInfo.model_provider,
          )!,
        },
        model: {
          name: assistantModelInfo.model_provider,
          function_name: 'remote',
          description:
            assistantModelInfo.description ||
            `${assistantModelInfo.model_provider} language model`,
        },
        agent: {
          name: `${assistantModelInfo.model_provider}_agent`,
          description: `AI agent powered by ${assistantModelInfo.model_provider}`,
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
  }, [assistantModelInfo, installUseCase]);

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
    modelData: assistantModelInfo,
    progress,
    isSuccess: result?.success || false,
  };
}
