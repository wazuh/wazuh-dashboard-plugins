# DevTools · Types (lib)

Minimal types that abstract CodeMirror and the HTTP client surfaces used by the library. They reduce reliance on `any` and make it easy to mock in tests.

## Structure

- `editor.ts`: `EditorLike`, `EditorGroup`, `EditorOutputLike`, `SendHooks`.
- `http.ts`: Request/response types (`HttpClient`, `HttpResponse`, `BuiltRequest`).

## Primary Usage

Implement `EditorLike` for tests or adapters:

```ts
import type { EditorLike } from './editor';

const editor: EditorLike = {
  getValue: () => 'GET /security/users',
  setSize: () => {},
  getDoc: () => ({ setValue: () => {} }),
  on: () => {},
  getCursor: () => ({ line: 0, ch: 0 }),
  cursorCoords: () => ({ top: 0 }),
};
```

Mock `HttpClient` to test `DevToolsActions` without network calls:

```ts
import type { HttpClient } from './http';

const http: HttpClient = {
  async request() { return { status: 200, statusText: 'OK', data: {} } as any; },
};
```

## Notes

- Keep the surface minimal to lower coupling and improve testability.

