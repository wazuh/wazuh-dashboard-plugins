import { useState, useCallback } from 'react';
import type {
  InstallAIDashboardAssistantDto,
  InstallationProgress,
} from '../domain';
import { InstallDashboardAssistantResponse } from '../domain';
import { UseCases } from '../../../setup';
import { useQuery } from '../../../hooks/use-query';

interface ModelConfiguration {
  model_provider: string;
  model_id: string;
  api_url: string;
  api_key: string;
  description?: string;
}

export function useAssistantInstallation() {
  const [assistantModelInfo, setAssistantModelInfo] = useState<
    ModelConfiguration | undefined
  >(undefined);
  const [progress, setProgress] = useState<InstallationProgress>(
    InstallDashboardAssistantResponse.start().progress,
  );
  const setModel = useCallback((data: ModelConfiguration) => {
    setAssistantModelInfo(data);
  }, []);

  const installerQuery = useCallback(async () => {
    let lastProgress = InstallDashboardAssistantResponse.start().progress;

    const onProgress = (installationProgress: InstallationProgress) => {
      lastProgress = installationProgress;
      setProgress(installationProgress);
    };

    if (!assistantModelInfo) {
      // No model info provided; return a failure response
      return InstallDashboardAssistantResponse.failure(
        'No model data provided',
        lastProgress,
      );
    }

    try {
      const request: InstallAIDashboardAssistantDto = {
        selected_provider: assistantModelInfo.model_provider,
        model_id: assistantModelInfo.model_id,
        api_url: assistantModelInfo.api_url,
        api_key: assistantModelInfo.api_key,
        description: assistantModelInfo.description,
      };

      const response = await UseCases.installDashboardAssistant(onProgress)(
        request,
      );

      if (response.success && response.data?.agentId) {
        return InstallDashboardAssistantResponse.success(
          response.data.agentId,
          lastProgress,
        );
      }

      return InstallDashboardAssistantResponse.failure(
        response.message ?? 'Installation failed',
        lastProgress,
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      return InstallDashboardAssistantResponse.failure(
        errorMessage,
        lastProgress,
      );
    }
  }, [assistantModelInfo]);

  const {
    data: result,
    isLoading,
    error: queryError,
    fetch,
    reset: resetQuery,
  } = useQuery<InstallDashboardAssistantResponse>({
    query: installerQuery,
    initialData: InstallDashboardAssistantResponse.start(),
    defaultErrorMessage: 'Unknown error occurred',
  });

  const install = useCallback(async () => {
    // Reset progress and reported failed steps at the start of an installation
    setProgress(InstallDashboardAssistantResponse.start().progress);
    await fetch();
  }, [fetch]);

  const reset = useCallback(() => {
    setAssistantModelInfo(undefined);
    setProgress(InstallDashboardAssistantResponse.start().progress);
    resetQuery();
  }, [resetQuery]);

  return {
    install,
    setModel,
    reset,
    isLoading,
    error: queryError ?? undefined,
    result,
    modelData: assistantModelInfo,
    progress,
    isSuccess: result?.success || false,
  };
}
