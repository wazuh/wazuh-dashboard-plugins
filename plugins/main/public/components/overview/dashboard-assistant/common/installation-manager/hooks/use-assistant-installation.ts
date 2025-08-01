import { useState, useCallback, useMemo } from 'react';
import { installDashboardAssistantUseCase } from '../install-dashboard-assistant';
import { InstallationManager } from '../installation-manager';
import type {
  InstallDashboardAssistantRequest,
  InstallationProgress,
} from '../domain/types';
import { InstallDashboardAssistantResponse } from '../domain/types';

interface ModelFormData {
  name: string;
  version: string;
  apiUrl: string;
  apiKey: string;
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
    const installationManager = new InstallationManager((progressUpdate) => {
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
        /*
        modelGroup: {
          name: `${modelData.name}_group`,
          description: `Model group for ${modelData.name}`,
        },*/
        connector: {
          name: `${modelData.name}_connector`,
          description: `Connector for ${modelData.name}`,
          endpoint: modelData.apiUrl,
          model: modelData.version,
          apiKey: modelData.apiKey,
        },
        model: {
          name: modelData.name,
          function_name: "remote",
          description: modelData.description || `${modelData.name} model`,
        },
        agent: {
          name: `${modelData.name}_agent`,
          description: `Agent for ${modelData.name}`,
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
        overallState: 'waiting' as any
      };
      setResult(InstallDashboardAssistantResponse.failure(errorMessage, currentProgress));
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
