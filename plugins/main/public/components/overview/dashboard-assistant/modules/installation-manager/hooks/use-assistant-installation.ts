import { useState, useCallback } from 'react';
import type {
  InstallAIDashboardAssistantDto,
  InstallationProgress,
} from '../domain/types';
import { InstallDashboardAssistantResponse } from '../domain/types';
import { UseCases } from '../../../setup';

interface ModelConfiguration {
  model_provider: string;
  model_id: string;
  api_url: string;
  api_key: string;
  description?: string;
}

export function useAssistantInstallation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<InstallDashboardAssistantResponse>(
    InstallDashboardAssistantResponse.start(),
  );
  const [assistantModelInfo, setAssistantModelInfo] = useState<
    ModelConfiguration | undefined
  >(undefined);
  const [progress, setProgress] = useState<InstallationProgress>(
    InstallDashboardAssistantResponse.start().progress,
  );

  const setModel = useCallback((data: ModelConfiguration) => {
    setAssistantModelInfo(data);
  }, []);

  const install = useCallback(async () => {
    if (!assistantModelInfo) {
      setError('No model data provided');
      return;
    }

    setIsLoading(true);
    setError(undefined);
    try {
      // Build minimal request; DTOs will be created JIT inside steps
      const request: InstallAIDashboardAssistantDto = {
        selected_provider: assistantModelInfo.model_provider,
        model_id: assistantModelInfo.model_id,
        api_url: assistantModelInfo.api_url,
        api_key: assistantModelInfo.api_key,
        description: assistantModelInfo.description,
      };

      const response = await UseCases.installDashboardAssistant(
        installationProgress => setProgress(installationProgress),
      )(request);
      if (response.data?.agentId) {
        setResult(
          InstallDashboardAssistantResponse.success(
            response.data?.agentId,
            progress,
          ),
        );
      }

      if (!response.success) {
        setError(response.message);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      // Create a failure response with current progress or empty progress
      const currentProgress =
        progress || InstallDashboardAssistantResponse.start().progress;
      setResult(
        InstallDashboardAssistantResponse.failure(
          errorMessage,
          currentProgress,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [assistantModelInfo]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(undefined);
    setResult(InstallDashboardAssistantResponse.start());
    setProgress(InstallDashboardAssistantResponse.start().progress);
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
