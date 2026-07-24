# Home Overview — render-performance analysis

Follow-up to an intermittent scroll-jank report ("sudden lag, a couple of
times while scrolling"). Two causes were identified from the code. The primary
one — layout shift from lazy content landing with no reserved height — is
**already fixed** (`loadingMinHeight` on `WidgetGroup`/`WidgetGroupBody`). This
document captures the **secondary** cause, which is **not yet addressed**, so
we don't lose track of it.

Everything below is reasoned from the code, not a browser profiler capture.
Confirm with the React Profiler / Performance panel before investing in a fix.

---

## Finding: full-subtree re-render when shared state resolves

### Mechanism

`useFindingsOverview` (on mount) and `useVulnerabilityOverview` (lazy) run at
the page-shell level in `HomeOverviewBody` (`home-overview.tsx`) and are passed
down as props to multiple sections:

- `findings` → Overview, Endpoint Security, Threat Hunting
- `vulnerabilities` → Threat Hunting, Threat Intelligence Feed

When either resolves (`loading` → `available`), the state update lives in
`HomeOverviewBody`, so **the entire body subtree re-renders** — every section,
not just the consumers.

On each of those re-renders, every live `useDataSource` instance re-executes a
block of **synchronous work on every render** (`use-data-source.ts:88-122`),
before its memoized effect even runs:

- `NavigationService.getInstance()` + `getUiSettings()` + `getHistory()`
- `createOsdUrlStateStorage({...})` — constructs a new URL-state storage object
- `osdUrlStateStorage.get('_a')` and `.get('_g')` — parse rison out of the URL
  twice
- `new PinnedAgentManager()` + `pinnedAgentManager.getPinnedAgent()`

There are **~18 `useDataSource` instances** mounted at once (one per widget
data group). So each shared-state resolution triggers ~18× that synchronous
block plus a full-subtree reconciliation, bunched into a single frame.

### Why it matches the symptom

The resolutions are **discrete** events — findings lands (~mount), then
vulnerabilities lands (when scrolled into view). That's "a couple of times,"
not continuous jank. Each is a single-frame main-thread spike, which reads as a
brief stutter if it coincides with a scroll frame.

### Related observation (same hook, separate issue)

The ~18 `useDataSource` **initialization effects** run on **mount regardless of
visibility** (`useEffect(..., [])` — `repository.getAll()`, `factory.createAll`,
index-pattern resolution). The lazy/viewport gating (`enabled`) only defers the
**fetch**, not the data-source setup. So mount does ~18 index-pattern
resolutions up front. Not scroll-related, but it's mount-time weight worth
knowing about.

---

## Caveats before fixing

- `useDataSource` is a **shared hook** used across the app, not something this
  feature owns. Changing its per-render work touches everything that consumes
  it — treat as a cross-cutting change with its own review, not a Home Overview
  tweak.
- The per-render cost per instance is small; the issue is the **multiplier**
  (~18) combined with **full-subtree** re-render. Reducing either factor helps.

## Candidate mitigations (roughly cheapest → broadest)

1. **`React.memo` the sections that don't consume the changed prop.** When the
   body re-renders because `findings`/`vulnerabilities` changed, Security
   Operations, Cloud Security, and (for a findings change) Threat Intel don't
   depend on it and could bail out of reconciliation. Cheap, local to this
   feature. Note the sections are wrapped in `withErrorBoundary` — verify the
   HOC forwards props in a way that lets `memo` compare effectively.

2. **Memoize the per-render synchronous block in `useDataSource`.** Wrap the
   URL-state read + `PinnedAgentManager` construction in `useMemo`/`useRef` so
   re-renders don't redo rison parsing and object allocation. Broad blast radius
   (shared hook) — biggest win per line, highest risk.

3. **Isolate shared state from the shell.** Move `findings`/`vulnerabilities`
   into a context with selector-based subscriptions (or co-locate each fetch in
   a small provider) so only actual consumers re-render, not the whole body.
   More architecture than the problem likely warrants unless the profiler shows
   the reconciliation (not the `useDataSource` block) dominates.

4. **Defer non-visible data-source initialization** (the related observation):
   gate the `useDataSource` init effect on visibility too, not just the fetch,
   so below-the-fold widgets don't resolve index patterns on mount. Changes the
   shared hook's contract — scope carefully.

## Suggested next step

Capture a React Profiler flame chart while scrolling and while findings/vulns
resolve. If the `useDataSource` synchronous block dominates → do (1) + (2). If
the reconciliation dominates → do (1), consider (3). Don't touch the shared
hook without profiler evidence that it's the hot path.
