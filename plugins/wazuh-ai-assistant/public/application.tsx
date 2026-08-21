import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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
import { ensureManagerSession } from './services/session-heal';
import {
  interruptConfirmationText,
  interruptConfirmationTitle,
} from './services/interrupt-confirm';
import { useProviders } from './hooks/use-providers';
import { createHashHistory } from 'history';

type Tab = 'chat' | 'settings';

const SETTINGS_PATH = '/settings';
/** `?addProvider=true` on `#/settings`: set by the chat CTA, opens the create-provider flyout. */
export const ADD_PROVIDER_PARAM = 'addProvider';

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

  // Height of the app frame, as a definite pixel value rather than a percentage.
  //
  // The frame's children (the Chat pane's `grid-template-rows: 1fr auto`, the transcript's own
  // scroll) are only meaningful against a definite height, and `height: 100%` cannot supply one
  // here: OSD's `.app-wrapper` sets only `min-height`, so a percentage height has nothing to
  // resolve against and collapses to `auto`. The previous `calc(100vh - 49px)` did produce a
  // definite height, but paid for it twice — Safari's `vh` flips as the toolbar hides (the classic
  // "the composer moved" report) and the 49px was a standing bet on the chrome bar's height.
  //
  // So: measure where the frame actually starts and subtract exactly that from `100dvh`. `dvh`
  // tracks the *dynamic* viewport, which is the unit Safari gets right, and the offset is measured
  // rather than assumed, so a taller or shorter global header needs no change here. The offset is
  // taken document-relative (`+ scrollY`) so a scrolled page cannot feed a negative rect back in.
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [frameHeight, setFrameHeight] = useState('100dvh');
  const measure = useCallback(() => {
    const node = frameRef.current;
    if (!node) {
      return;
    }
    const offset = Math.max(
      0,
      Math.round(node.getBoundingClientRect().top + window.scrollY),
    );
    setFrameHeight(`calc(100dvh - ${offset}px)`);
  }, []);
  // Re-measure after EVERY commit, not only when the observer or a window resize says so.
  // Applying a new height CHANGES this element's own box, which changes its ancestors' boxes, which
  // is a second-order settle the observer only learns about a frame (or several) later: measured
  // live, removing 60px of chrome left the frame stuck at the taller offset for over 1.5s, so the
  // composer sat 60px short of the bottom until a later notification finally landed. Reading here,
  // post-layout, converges in the same commit. There is no loop risk: `setFrameHeight` writes the
  // same string once the offset is stable and React bails out of an identical state update.
  useLayoutEffect(measure);
  useLayoutEffect(() => {
    const node = frameRef.current;
    if (!node) {
      return;
    }
    window.addEventListener('resize', measure);
    // Guarded because jsdom has no ResizeObserver: there the initial measure is enough.
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => measure());
    // The whole ancestor chain, NOT just `document.body`. Anything that appears above the app after
    // mount — a global banner, `wazuh-check-updates`' own update notice, which renders when its
    // async check returns — pushes the frame down without changing body's box at all, so a
    // body-only observer never fires and the height stays at whatever it was measured as on mount.
    // Measured live: 60px of extra chrome moved the frame's top from 49 to 109 while the height
    // stayed `calc(100dvh - 49px)`, putting the composer 60px BELOW the bottom of the screen. Some
    // ancestor's box grows in any layout where a banner actually pushes content down, so observing
    // the chain is what turns that into a re-measure. The loop reaches `document.body` and
    // `documentElement` on its way up, so they need no separate registration.
    for (
      let ancestor: HTMLElement | null = node.parentElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      observer?.observe(ancestor);
    }
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [measure]);
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
          {({ match, location }: RouteChildrenProps) => {
            const isSettings = Boolean(match);
            const autoOpenCreateProvider =
              isSettings &&
              new URLSearchParams(location.search).has(ADD_PROVIDER_PARAM);
            // Flipped here rather than in an effect: this render only runs once the location has
            // already changed, so setting the ref during it needs no extra render to take effect.
            if (isSettings) {
              settingsEverOpenedRef.current = true;
            }
            return (
              // Full-height frame: `frameHeight` is a measured `calc(100dvh - <offset>px)` (see the
              // hook above) so the Chat pane's grid always has a definite height to divide. The tab
              // bar + spacer live INSIDE this frame and take their own natural height via flex. The
              // content row is `flex:1` with `overflow:auto` so the Chat tab fills exactly (its own
              // panes scroll internally) while Settings, which is taller than the viewport, scrolls.
              <div
                ref={frameRef}
                style={{
                  height: frameHeight,
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
                      onNavigateToSettings={() =>
                        history.push(
                          `${SETTINGS_PATH}?${ADD_PROVIDER_PARAM}=true`,
                        )
                      }
                      // Plain Settings visit (iteration-4 item 2's "Manage providers" footer
                      // item) — reuses the SAME tab-switch helper the visible Settings tab click
                      // already goes through, rather than a second hardcoded `SETTINGS_PATH` push.
                      onManageProviders={() => navigateTo('settings')}
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
                        // The hidden tab must not keep a portalled flyout on screen — see the
                        // prop's own doc comment.
                        isActive={isSettings}
                        onProvidersChanged={refreshProviders}
                        autoOpenCreateForm={autoOpenCreateProvider}
                        onCreateFormOpenChange={open => {
                          if (open === autoOpenCreateProvider) {
                            return;
                          }
                          history.replace(
                            open
                              ? `${SETTINGS_PATH}?${ADD_PROVIDER_PARAM}=true`
                              : SETTINGS_PATH,
                          );
                        }}
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

  // Proactive session heal on every app mount: establishes the Manager API cookies
  // before any tab issues Manager-gated requests; pages' own calls share this in-flight execution.
  void ensureManagerSession(core.http);

  // The app's own frame sizes itself with `height: 100%`, which is only meaningful if every
  // ancestor up to a height-constrained one also has a definite height. OSD hands us a plain mount
  // node inside its (already height-constrained) application wrapper, so this one assignment is
  // what closes the chain — and is what lets the frame below drop `calc(100vh - 49px)`, whose `vh`
  // unit is unreliable on Safari and whose 49px was a hardcoded bet on the chrome bar's height.
  // A grid/flex child's automatic minimum size is its content size; without this the mount node
  // refuses to shrink and pushes the composer off-screen, which Safari surfaces before Chrome.
  // The frame inside sizes itself from a measured `100dvh` offset (see `App`), so no height is
  // asserted here — OSD's wrapper only sets `min-height`, which a percentage cannot resolve.
  element.style.minHeight = '0';

  const history = createHashHistory();
  const root = createRoot(element);
  root.render(<App core={core} history={history} onAppLeave={onAppLeave} />);
  return () => root.unmount();
};
