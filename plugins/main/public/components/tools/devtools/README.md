# DevTools (Wazuh Dashboard)

Developer console to interact with the Wazuh API from OpenSearch Dashboards. It provides a request editor (left) and a read‑only response viewer (right), with endpoint and parameter autocomplete.

- Root component: `devtools-old.tsx` (UI container)
- Headless library: `lib/` (actions, hints, grouping, services)
- UI layer: `application/` (components and hooks)

## Internal Structure

- `application/`: UI components (tabs, header, mirrors) and hooks (`use-setup`, hotkeys).
- `lib/`: Headless public API (request grouping, autocomplete, request/response, layout, types, utils).
- `types/`: UI‑specific helpers (key codes/shortcuts).
- `constants.ts`: IDs and layout metrics (container, columns, mirror textareas).
- `initial-buffer.ts`: Initial buffer with sample requests.
- `excluded-devtools-autocomplete-keys.ts`: Keys ignored to trigger autocomplete.
- `__snapshots__/`: UI test snapshots.

## Primary Usage

DevTools renders as a tool view and orchestrates:

1. CodeMirror initialization (two editors): `application/hooks/use-setup.ts`.
2. Behavior configuration: `lib/init.ts` (autocomplete, grouping, events, layout).
3. Sending the active request: `lib/api.ts` → `DevToolsActions.send`.

The `devtools-old.tsx` container wires everything together, exposing the Send button (Ctrl/Cmd + Enter) and JSON export.

## Dependencies

- Internal: `react-services` (state, error orchestrator, HTTP), `common/constants` (log levels), `utils/codemirror`, `utils/dynamic-height`.
- External: React, Elastic EUI, CodeMirror, jQuery, `query-string`.

## Testing

- Unit/integration tests live under `application/` and `lib/` (including `__snapshots__`).
- From `plugins/main`:
  ```bash
  yarn test:jest
  ```

## Minimal Example

Render DevTools as a route/view:

```tsx
import React from 'react';
import { ToolDevTools } from './devtools-old';

export default function RouteDevTools() {
  return <ToolDevTools />;
}
```

Programmatically send (if you need external control):

```ts
import { send, initEditors } from './lib';

// editorInput/editorOutput are CodeMirror instances (fromTextArea)
await initEditors(editorInput, editorOutput);
send(editorInput, editorOutput, false, {
  onStart: () => console.log('Sending...'),
  onEnd: ({ status, durationMs, ok }) => console.log(status, durationMs, ok),
});
```

## Notes

- `editorInput.model` must be populated with API routes (`/api/routes`) for autocomplete to work.
- Shortcut: Ctrl/Cmd + Enter triggers `send` on the active group.
- See also `plugins/main/README.md` for overall plugin context.
