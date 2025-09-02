# DevTools · Services

Low‑level services to build HTTP requests from editor groups, perform the call, interpret the result, and fetch available routes for autocomplete.

## Structure

- `request-builder.ts`: Detects method/path, parses inline or multi‑line body JSON, strips reserved flags.
- `wz-http-client.ts`: `HttpClient` implementation backed by `WzRequest`.
- `response-handler.ts`: Normalizes responses (status, ok, body) and detects restrictions (admin mode).
- `routes-service.ts`: Loads `/api/routes` to populate `editorInput.model`.
- `error-service.ts`: Thin wrapper around the Error Orchestrator (unified logging).
- `api-routes.types.ts`: Types for API routes.

## Primary Usage

Build request from a group:

```ts
import { RequestBuilder } from './request-builder';

const builder = new RequestBuilder();
const built = builder.build(currentGroup);
// built: { method, path, body }
```

Normalize response and check for admin mode:

```ts
import { ResponseHandler } from './response-handler';

const rh = new ResponseHandler();
if (rh.isAdminModeForbidden(res)) {
  // handle admin‑mode restriction
}
const { body, status, statusText, ok } = rh.normalize(res);
```

Fetch available routes:

```ts
import { ApiRoutesService } from './routes-service';

const routes = await new ApiRoutesService().getAvailableRoutes();
editorInput.model = routes;
```

## Dependencies

- Internal: `utils/json` (safe parsing and flags stripping), `constants/*`.
- External: `query-string`, `react-services` (`WzRequest`, `GenericRequest`).

## Testing

- Tests in `*.test.ts` (request builder, routes, response handler, HTTP client).
- Run from `plugins/main`:
  ```bash
  yarn test:jest
  ```

## Notes

- Reserved flags (e.g., `pretty`) are removed from query/body before sending.
- `WzHttpClient` returns the direct result from `WzRequest.apiReq` to keep compatibility.

