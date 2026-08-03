import { useCallback, useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { HttpSetup } from '../../../../src/core/public';
import { ProviderSummary } from '../../common/types';
import { SettingsService } from '../services/settings-service';

const PROVIDERS_LOAD_TIMEOUT_MS = 20_000;

export interface ProvidersState {
  providers: ProviderSummary[];
  providersLoaded: boolean;
  providersError: string | null;
  selectedProviderId: string;
  setSelectedProviderId: (id: string) => void;
  refreshProviders: () => void;
}

export function useProviders(http: HttpSetup): ProvidersState {
  const [settingsService] = useState(() => new SettingsService(http));
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [providersError, setProvidersError] = useState<string | null>(null);
  // The pending deadline, so a refresh replaces the previous one and unmount clears it — the
  // flyout mount unmounts on every close, and a stray 20s timer would set state on a dead hook.
  const deadlineRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const refreshProviders = useCallback(() => {
    clearTimeout(deadlineRef.current);
    const deadline = setTimeout(() => {
      setProvidersError(
        i18n.translate('wazuhAiAssistant.chat.providersLoadTimeout', {
          defaultMessage:
            'Loading the configured providers timed out. Reload the page, or check the Settings tab.',
        }),
      );
      setProvidersLoaded(true);
    }, PROVIDERS_LOAD_TIMEOUT_MS);
    deadlineRef.current = deadline;

    settingsService
      .list()
      .then(list => {
        clearTimeout(deadline);
        setProviders(list);
        setProvidersError(null);
        setSelectedProviderId(current => {
          if (current && list.some(provider => provider.id === current)) {
            return current;
          }
          const defaultProvider =
            list.find(provider => provider.isDefault) ?? list[0];
          return defaultProvider ? defaultProvider.id : '';
        });
      })
      .catch(() => {
        clearTimeout(deadline);
        setProvidersError(
          i18n.translate('wazuhAiAssistant.chat.providersLoadError', {
            defaultMessage:
              'Could not load configured providers. Check the Settings tab.',
          }),
        );
      })
      .finally(() => setProvidersLoaded(true));
  }, [settingsService]);

  useEffect(() => {
    refreshProviders();
    return () => clearTimeout(deadlineRef.current);
  }, [refreshProviders]);

  return {
    providers,
    providersLoaded,
    providersError,
    selectedProviderId,
    setSelectedProviderId,
    refreshProviders,
  };
}
