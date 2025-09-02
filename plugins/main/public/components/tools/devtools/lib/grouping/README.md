# DevTools · Request Grouping

Splits the editor content into logical request groups (lines from `METHOD /path` through an optional JSON body), determines the active group based on cursor/viewport, highlights lines, and renders error widgets for invalid JSON.

## Structure

- `grouping-service.ts`: Main service with injectable dependencies for UI, state, and JSON linter.
- `services/`
  - `ui-controller.ts`: UI controls (show/hide buttons, positioning).
  - `state-adapter.ts`: Persists the current buffer state.
  - `json-linter.ts`: JSON validation and messages.
  - `docs-link-resolver.ts`: Documentation link based on request line.
- `index.ts`: Convenience exports (analyze/calculate/highlight/check...).

## Primary Usage

```ts
import { GroupingService } from './grouping-service';

const grouping = new GroupingService();
const groups = grouping.parseGroups(editorInput);
const active = grouping.selectActiveGroup(editorInput, false, groups);
grouping.highlightGroup(editorInput, active || undefined);
const invalid = grouping.validateJson(editorInput, groups);
```

## Dependencies

- Internal: `constants/regex`, `constants/ui`, `services/*`, `adapters/error-adapter` (indirectly via `ErrorService`).
- External: jQuery (visibility/position calculations and DOM manipulation).

## Testing

- Tests in `grouping/*.test.ts` and `grouping/services/*.test.ts`.
- Run from `plugins/main`:
  ```bash
  yarn test:jest
  ```

## Example

Select the first visible group when the cursor is not inside any group:

```ts
const groups = grouping.parseGroups(editor);
const current = grouping.selectActiveGroup(editor, false, groups);
```

## Notes

- Highlighting uses the `CodeMirror-styled-background` class (`constants/ui.ts`).
- Error widgets are removed/recreated on each validation run.

