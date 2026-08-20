import { useCallback, useEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { HttpSetup } from '../../../../src/core/public';
import { ProviderSummary } from '../../common/types';
import {
  PROVIDERS_CHANGED_EVENT,
  SettingsService,
} from '../services/settings-service';

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

  // Every resolution below is gated on this: the flyout mount unmounts on every close, so a
  // refresh triggered right before that (or by a PROVIDERS_CHANGED_EVENT it saw on the way out)
  // would otherwise set state on a dead hook.
  const isMountedRef = useRef(true);
  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    [],
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
        if (!isMountedRef.current) {
          return;
        }
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
        if (!isMountedRef.current) {
          return;
        }
        setProvidersError(
          i18n.translate('wazuhAiAssistant.chat.providersLoadError', {
            defaultMessage:
              'Could not load configured providers. Check the Settings tab.',
          }),
        );
      })
      .finally(() => {
        if (isMountedRef.current) {
          setProvidersLoaded(true);
        }
      });
  }, [settingsService]);

  // Load once per mount, then again on every PROVIDERS_CHANGED_EVENT. Every consumer of this hook
  // is fixed at once by subscribing here — notably the header flyout's own independent instance
  // (public/components/header/assistant-chat-panel.tsx), which no prop callback from the Settings
  // page can reach because both views stay mounted side by side. Event-driven only: no polling.
  useEffect(() => {
    refreshProviders();
    window.addEventListener(PROVIDERS_CHANGED_EVENT, refreshProviders);
    return () => {
      window.removeEventListener(PROVIDERS_CHANGED_EVENT, refreshProviders);
      clearTimeout(deadlineRef.current);
    };
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
