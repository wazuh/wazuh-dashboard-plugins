import React, { useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Router,
  Route,
  Redirect,
  RouteChildrenProps,
  RouteComponentProps,
} from 'react-router-dom';
import { AppMountParameters, CoreStart } from '../../../src/core/public';
import { I18nProvider } from '@osd/i18n/react';
import { EuiTabs, EuiTab, EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { ChatPage } from './components/chat/chat-page';
import { SettingsPage } from './components/settings/settings-page';
import {
  interruptConfirmationText,
  interruptConfirmationTitle,
} from './services/interrupt-confirm';
import { useProviders } from './hooks/use-providers';
import { createHashHistory } from 'history';

type Tab = 'chat' | 'settings';

const SETTINGS_PATH = '/settings';

/** Unknown paths fall back to chat so a stale/mistyped deep link still lands somewhere usable. */
export const routeFromPathname = (pathname: string): Tab =>
  pathname.replace(/\/+$/, '') === SETTINGS_PATH ? 'settings' : 'chat';

/**
 * Provider list/selection is owned here (not by ChatPage) so a tab switch away from Chat and back
 * never loses the selection, and so SettingsPage can report back through onProvidersChanged
 * whenever it creates/edits/deletes/re-defaults a provider and keep this list (and the Chat tab's
 * selection) in sync without needing a full remount. The state itself lives in the `useProviders`
 * hook (hooks/use-providers.ts), shared with the header-button flyout. The actual provider
 * <select> control renders inside ChatPage's own header row (next to the privacy chip) rather
 * than up here, so it reads as part of the chat surface instead of a separate floating control —
 * see `onProviderChange` passed to ChatPage below.
 */
/**
 * `onAppLeave` is the platform's one hook for "the user is leaving this app": OSD calls it both for
 * a navigation to another dashboard app (where it renders a confirm modal) and for a browser
 * reload/tab close (where it arms the native `beforeunload` prompt) — see
 * src/core/public/application/application_service.tsx. Registering it here, once, is what keeps a
 * running answer from being thrown away without the user being asked.
 */
const App: React.FC<{
  core: CoreStart;
  history: AppMountParameters['history'];
  onAppLeave: AppMountParameters['onAppLeave'];
}> = ({ core, history, onAppLeave }) => {
  // Settings is mounted lazily (nothing should issue its requests for a user who never opens the
  // tab) but, once opened, stays mounted for the same reason ChatPage does — see the render below.
  // A ref, not state: it's flipped from inside the <Route> render below rather than a separate
  // effect, and by the time that render runs the location has already changed, so no extra
  // re-render is needed to pick it up.
  const settingsEverOpenedRef = useRef(
    routeFromPathname(history.location.pathname) === 'settings',
  );
  const {
    providers,
    providersLoaded,
    providersError,
    selectedProviderId,
    setSelectedProviderId,
    refreshProviders,
  } = useProviders(core.http);
  // Read by the leave handler below, which is registered ONCE and must always see the current value
  // — hence a ref rather than state (a stale closure here would silently stop warning anyone).
  const isGeneratingRef = useRef(false);
  const handleGeneratingChange = useCallback((generating: boolean) => {
    isGeneratingRef.current = generating;
  }, []);

  const navigateTo = useCallback(
    (next: Tab) => {
      if (next !== routeFromPathname(history.location.pathname)) {
        history.push(next === 'settings' ? SETTINGS_PATH : '/');
      }
    },
    [history],
  );

  useEffect(() => {
    onAppLeave(actions => {
      if (!isGeneratingRef.current) {
        return actions.default();
      }
      // The same copy the in-app confirmation uses (services/interrupt-confirm.ts) — one decision,
      // one wording, whichever way the user is leaving.
      return actions.confirm(
        interruptConfirmationText(),
        interruptConfirmationTitle(),
      );
    });
  }, [onAppLeave]);

  return (
    <I18nProvider>
      <Router history={history}>
        {/* Path-less, so it matches (and its `render` fires) on every navigation. Anything other
            than the two known tabs snaps the URL itself back to `/` — unlike `routeFromPathname`'s
            fallback above, which just treats an unknown path AS chat without correcting the address
            bar, this actually corrects it, so a stale/mistyped/removed deep link doesn't linger in
            the URL (and in browser history) once the user is redirected off it. `replace` (the
            default for <Redirect>) rather than `push`, so it doesn't leave the bad path as a
            separate back-button stop. */}
        <Route
          render={({ location }: RouteComponentProps) => {
            const normalized = location.pathname.replace(/\/+$/, '') || '/';
            return normalized === '/' ||
              normalized === SETTINGS_PATH ||
              normalized.startsWith('/conversation') ? null : (
              <Redirect to='/' />
            );
          }}
        />
        {/* `exact` matched here, not just prefixed: an unknown/stale nested path (e.g. a mistyped
            `/settings/foo` deep link) should fall back to Chat, same as `routeFromPathname` above.
            `children` (a function, not `component`/`render`) is used because it — unlike the other
            two — is called on EVERY render regardless of match, which is what lets both tabs below
            stay mounted instead of being unmounted by the router when the path doesn't match. */}
        <Route exact path={SETTINGS_PATH}>
          {({ match }: RouteChildrenProps) => {
            const isSettings = Boolean(match);
            // Flipped here rather than in an effect: this render only runs once the location has
            // already changed, so setting the ref during it needs no extra render to take effect.
            if (isSettings) {
              settingsEverOpenedRef.current = true;
            }
            return (
              // Full-height frame so the Chat tab can fill the viewport (its internal layout uses
              // height:100%, which is only meaningful against a bounded ancestor). `100vh - 49px`
              // subtracts the OSD global header (the stable ~49px chrome bar this app mounts
              // beneath); the tab bar + spacer below live INSIDE this frame and consume their own
              // natural height via flex, so they don't need to be in the calc. The content row is
              // `flex:1` with `overflow:auto` so the Chat tab fills exactly (its own panes scroll
              // internally) while the Settings tab, which is taller than the viewport, scrolls
              // normally.
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
                    isSelected={!isSettings}
                    onClick={() => navigateTo('chat')}
                  >
                    {i18n.translate('wazuhAiAssistant.app.chatTab', {
                      defaultMessage: 'Chat',
                    })}
                  </EuiTab>
                  <EuiTab
                    isSelected={isSettings}
                    onClick={() => navigateTo('settings')}
                  >
                    {i18n.translate('wazuhAiAssistant.app.settingsTab', {
                      defaultMessage: 'Settings',
                    })}
                  </EuiTab>
                </EuiTabs>
                <EuiSpacer size='s' />
                {/* Both tabs are HIDDEN, never unmounted. Swapping the two components on every tab
                    switch destroyed ChatPage's entire state: the visible transcript, the active
                    conversation id (so the next turn created a second saved conversation instead of
                    continuing the one the user was in), the per-conversation pseudonym map, and the
                    tool-call history a follow-up question depends on. Visiting Settings for five
                    seconds is not a reason to lose the conversation, so the Chat tab keeps living
                    behind `display: none` — which, unlike unmounting, also leaves an in-flight
                    answer streaming into the transcript the user returns to. */}
                <div
                  style={{ flex: '1 1 auto', minHeight: 0, overflow: 'auto' }}
                >
                  <div
                    style={{
                      height: '100%',
                      display: isSettings ? 'none' : '',
                    }}
                  >
                    <ChatPage
                      core={core}
                      history={history}
                      isActive={!isSettings}
                      providers={providers}
                      providersLoaded={providersLoaded}
                      providersError={providersError}
                      selectedProviderId={selectedProviderId}
                      onProviderChange={setSelectedProviderId}
                      onNavigateToSettings={() => navigateTo('settings')}
                      onGeneratingChange={handleGeneratingChange}
                    />
                  </div>
                  {settingsEverOpenedRef.current && (
                    <div
                      style={{
                        height: '100%',
                        display: isSettings ? '' : 'none',
                      }}
                    >
                      <SettingsPage
                        core={core}
                        onProvidersChanged={refreshProviders}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        </Route>
      </Router>
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
  { element, onAppLeave }: AppMountParameters,
): (() => void) => {
  core.chrome.setBreadcrumbs([
    {
      text: i18n.translate('wazuhAiAssistant.app.breadcrumb', {
        defaultMessage: 'AI Assistant',
      }),
    },
  ]);

  const history = createHashHistory();
  const root = createRoot(element);
  root.render(<App core={core} history={history} onAppLeave={onAppLeave} />);
  return () => root.unmount();
};
