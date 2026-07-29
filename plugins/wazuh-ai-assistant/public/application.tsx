import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppMountParameters, CoreStart } from '../../../src/core/public';
import { I18nProvider } from '@osd/i18n/react';
import { EuiTabs, EuiTab, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ChatPage } from './components/chat/chat-page';
import { SettingsPage } from './components/settings/settings-page';
import { SettingsService } from './services/settings-service';
import { ProviderSummary } from '../common/types';

type Route = 'chat' | 'settings';

/** How long the first provider load may take before the app stops waiting on it — see
 * `refreshProviders`. Generous for a slow cluster, short enough that no one stares at a spinner. */
const PROVIDERS_LOAD_TIMEOUT_MS = 20_000;

/**
 * Provider list/selection is owned here (not by ChatPage) so a tab switch away from Chat and back
 * never loses the selection, and so SettingsPage can report back through onProvidersChanged
 * whenever it creates/edits/deletes/re-defaults a provider and keep this list (and the Chat tab's
 * selection) in sync without needing a full remount. The actual provider <select> control now
 * renders inside ChatPage's own header row (next to the privacy chip) rather than up here, so it
 * reads as part of the chat surface instead of a separate floating control — see
 * `onProviderChange` passed to ChatPage below.
 */
const App: React.FC<{ core: CoreStart }> = ({ core }) => {
  const [route, setRoute] = useState<Route>('chat');
  // Settings is mounted lazily (nothing should issue its requests for a user who never opens the
  // tab) but, once opened, stays mounted for the same reason ChatPage does — see the render below.
  const [settingsEverOpened, setSettingsEverOpened] = useState(false);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [settingsService] = useState(() => new SettingsService(core.http));

  const refreshProviders = useCallback(() => {
    // Deadline for the FIRST load. `providersLoaded` gates the Chat tab's whole rendering — until it
    // flips, the tab shows a spinner and nothing else — so a request that never settles (a hung
    // proxy, a dropped connection) left the chat spinning forever with no explanation and no way
    // out. On expiry the app renders its normal "could not load providers" state instead, and a
    // later successful response still takes effect.
    const deadline = setTimeout(() => {
      setProvidersError(
        i18n.translate('wazuhAiAssistant.chat.providersLoadTimeout', {
          defaultMessage:
            'Loading the configured providers timed out. Reload the page, or check the Settings tab.',
        }),
      );
      setProvidersLoaded(true);
    }, PROVIDERS_LOAD_TIMEOUT_MS);

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
  }, [refreshProviders]);

  return (
    <I18nProvider>
      {/* Full-height frame so the Chat tab can fill the viewport (its internal layout uses
          height:100%, which is only meaningful against a bounded ancestor). `100vh - 49px`
          subtracts the OSD global header (the stable ~49px chrome bar this app mounts beneath);
          the tab bar + spacer below live INSIDE this frame and consume their own natural height
          via flex, so they don't need to be in the calc. The content row is `flex:1` with
          `overflow:auto` so the Chat tab fills exactly (its own panes scroll internally) while the
          Settings tab, which is taller than the viewport, scrolls normally. */}
      <div
        style={{
          height: 'calc(100vh - 49px)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <EuiTabs size='s'>
          <EuiTab
            isSelected={route === 'chat'}
            onClick={() => setRoute('chat')}
          >
            {i18n.translate('wazuhAiAssistant.app.chatTab', {
              defaultMessage: 'Chat',
            })}
          </EuiTab>
          <EuiTab
            isSelected={route === 'settings'}
            onClick={() => {
              setSettingsEverOpened(true);
              setRoute('settings');
            }}
          >
            {i18n.translate('wazuhAiAssistant.app.settingsTab', {
              defaultMessage: 'Settings',
            })}
          </EuiTab>
        </EuiTabs>
        <EuiSpacer size='s' />
        {/* Both tabs are HIDDEN, never unmounted. Swapping the two components on every tab switch
            destroyed ChatPage's entire state: the visible transcript, the active conversation id
            (so the next turn created a second saved conversation instead of continuing the one the
            user was in), the per-conversation pseudonym map, and the tool-call history a follow-up
            question depends on. Visiting Settings for five seconds is not a reason to lose the
            conversation, so the Chat tab keeps living behind `display: none` — which, unlike
            unmounting, also leaves an in-flight answer streaming into the transcript the user
            returns to. */}
        <div style={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto' }}>
          <div
            style={{ height: '100%', display: route === 'chat' ? '' : 'none' }}
          >
            <ChatPage
              core={core}
              providers={providers}
              providersLoaded={providersLoaded}
              providersError={providersError}
              selectedProviderId={selectedProviderId}
              onProviderChange={setSelectedProviderId}
              onNavigateToSettings={() => {
                setSettingsEverOpened(true);
                setRoute('settings');
              }}
            />
          </div>
          {settingsEverOpened && (
            <div
              style={{
                height: '100%',
                display: route === 'settings' ? '' : 'none',
              }}
            >
              <SettingsPage core={core} onProvidersChanged={refreshProviders} />
            </div>
          )}
        </div>
      </div>
    </I18nProvider>
  );
};

/**
 * Mount function passed to core.application.register(). Uses React 18's createRoot — the same
 * pattern OSD 3.6 core uses for every app mount (verified in src/core/public/utils/mount.tsx
 * and rendering_service.tsx at v5.0.0-beta3); the legacy ReactDOM.render API is gone in
 * react-dom 18's client split.
 */
export const renderApp = (
  core: CoreStart,
  { element }: AppMountParameters,
): (() => void) => {
  core.chrome.setBreadcrumbs([
    {
      text: i18n.translate('wazuhAiAssistant.app.breadcrumb', {
        defaultMessage: 'AI Assistant',
      }),
    },
  ]);
  const root = createRoot(element);
  root.render(<App core={core} />);
  return () => root.unmount();
};
