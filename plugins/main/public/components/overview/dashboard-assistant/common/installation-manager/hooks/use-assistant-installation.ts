import { useState, useCallback, useMemo } from 'react';
import { installDashboardAssistantUseCase } from '../install-dashboard-assistant';
import { InstallationManager } from '../installation-manager';
import { createMockRepositories } from '../infrastructure/mock-repositories';
import type {
  InstallDashboardAssistantRequest,
  InstallDashboardAssistantResponse,
} from '../domain/types';

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

  // Create installation use case with mock repositories
  const installUseCase = useMemo(() => {
    // Create installation manager (now handles repositories internally)
    const installationManager = new InstallationManager();

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
        modelGroup: {
          name: `${modelData.name}_group`,
          description: `Model group for ${modelData.name}`,
        },
        connector: {
          name: `${modelData.name}_connector`,
          description: `Connector for ${modelData.name}`,
          endpoint: modelData.apiUrl,
          model: modelData.version,
          apiKey: modelData.apiKey,
        },
        model: {
          name: modelData.name,
          version: modelData.version,
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
      setResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [modelData, installUseCase]);

  return {
    install,
    setModel,
    isLoading,
    error,
    result,
    modelData,
    isSuccess: result?.success || false,
  };
}
