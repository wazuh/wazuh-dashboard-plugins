# DevTools · Layout

Functions that manage the DevTools area layout: resizable columns and dynamic height.

## Structure

- `resizable-columns.ts`: Drag the separator to adjust column widths.
- `dynamic-height.ts`: Recompute available height on window resize.
- `index.ts`: Re‑exports.

## Primary Usage

```ts
import { setupResizableColumns, setupDynamicHeight } from './layout';

setupResizableColumns(window.document);
setupDynamicHeight(window);
```

## Dependencies

- Internal: `../../constants` (container/column IDs).
- External: jQuery (`resizable-columns`) and `utils/dynamic-height`.

## Testing

- Covered indirectly by UI integration tests; logic is mostly wiring.

## Notes

- Requires elements with the IDs declared in `constants.ts`.
