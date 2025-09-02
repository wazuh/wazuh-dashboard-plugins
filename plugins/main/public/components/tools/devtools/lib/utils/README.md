# DevTools · Utils

Small helpers used by the library, currently focused on safe JSON handling and reserved flags stripping.

## Structure

- `json.ts`: `safeJsonParse` and `stripReservedFlags`.
- `json.test.ts`: Parsing and cleanup coverage.

## Primary Usage

```ts
import { safeJsonParse, stripReservedFlags } from './json';

const obj = safeJsonParse('{"a":1}', {});
const cleaned = stripReservedFlags({ pretty: true, x: 1 }); // => { x: 1 }
```

## Notes

- `safeJsonParse` returns the provided fallback when parsing fails.
- Reserved flags are centralized to simplify future changes.

