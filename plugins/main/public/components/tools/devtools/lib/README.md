# DevTools · Headless Library

Public, UI‑agnostic API that orchestrates autocomplete, request grouping, request/response handling, and response normalization. Designed to be testable and consumed by the `application/` layer.

## Structure

- `index.ts`: Entry point and public re‑exports.
- `api.ts`: Simple facade (`send`, `saveEditorContentAsJson`).
- `actions/dev-tools-actions.ts`: Side‑effectful actions (send request, error handling, timing).
- `grouping/`: Split buffer into groups (method/path/body), select and highlight active group.
- `hints/`: CodeMirror autocomplete based on a dictionary of routes.
- `layout/`: Resizable columns and dynamic height.
- `services/`: Build requests, HTTP client, response normalization, API routes.
- `adapters/`: Adapters (e.g., parse errors into output format).
- `types/`: Minimal surfaces for `EditorLike`/HTTP.
- `utils/`: Helpers (safe JSON, reserved flags stripping).
- `constants/`: Config tokens for HTTP/UI.

## Primary Usage

Import from `index.ts`:

```ts
import {
  initEditors,
  send,
  registerDictionaryHint,
  ensureAutocompleteCommand,
  GroupingService,
} from './lib';
```

- `initEditors(editorInput, editorOutput)`: configures events, layout, and loads routes (`/api/routes`).
- `send(editorInput, editorOutput, firstTime?, hooks?)`: sends the active group and writes the normalized response.
- `registerDictionaryHint(editorInput)`/`ensureAutocompleteCommand()`: enables CodeMirror autocomplete.

## Dependencies

- Internal: `react-services` (WzRequest/GenericRequest, Error Orchestrator), `common/constants`.
- External: CodeMirror, `query-string`, jQuery.

## Testing

- Module‑level tests in `grouping/`, `hints/`, `services/`, and `utils/`.
- Run from `plugins/main`:
  ```bash
  yarn test:jest
  ```

## Example

Use `DevToolsActions` with an injected HTTP client (for tests):

```ts
import { DevToolsActions } from './actions/dev-tools-actions';

class FakeHttp {
  async request(method: any, path: string, body: any) {
    return { status: 200, statusText: 'OK', data: { ok: true, method, path, body } };
  }
}

const actions = new DevToolsActions(new FakeHttp() as any);
await actions.send(editorInput, editorOutput, false, {
  onStart: () => {/* ... */},
  onEnd:  ({ status, durationMs }) => {/* ... */},
});
```

## Notes

- `editorInput.model` must contain available routes (loaded by `ApiRoutesService`).
- Inline and multi‑line JSON detection is handled in `RequestBuilder`.

