# DevTools · Application Layer (UI)

Visual components and hooks that assemble the console: tabs, request header with status, mirror columns (textareas) used to instantiate CodeMirror, and keyboard shortcuts.

## Structure

- `components/`
  - `dev-tools-tabs.tsx`: Navigation tabs for tools.
  - `dev-tools-header.tsx`: Displays last request status (status, duration) and JSON export.
  - `dev-tools-mirrors.tsx`: DOM holders (textareas) that CodeMirror mounts as mirrors.
  - `components/separator/`: Column separator (draggable via `lib/layout`).
- `hooks/`
  - `use-setup.ts`: Creates CodeMirror instances, calls `lib/init.ts`, and shows the welcome message.
  - `use-hotkey-for-dev-tools.ts`: Registers Ctrl/Cmd + Enter to execute `send`.

## Primary Usage

- `use-setup.ts` initializes both editors and returns `editorInputRef`/`editorOutputRef`.
- `dev-tools-mirrors.tsx` provides the IDs from `constants.ts` expected by `lib/layout` and `use-setup`.

## Dependencies

- Internal: `../../constants`, `../../lib`, `../../../../kibana-services`, `../../../../react-services`.
- External: React, Elastic EUI, CodeMirror.

## Testing

- Tests live in `components/*.test.tsx` and `hooks/*.test.ts`.
- Run from `plugins/main`:
  ```bash
  yarn test:jest
  ```

## Example

Using the setup hook in a custom container:

```tsx
import React from 'react';
import useSetup from '../hooks/use-setup';
import { EDITOR_MIRRORS } from '../../constants';

export function MyDevToolsContainer() {
  const { editorInputRef, editorOutputRef } = useSetup();
  return (
    <>
      {/* Mirrors: CodeMirror mounts onto these textareas */}
      <textarea id={EDITOR_MIRRORS.INPUT_ID} />
      <textarea id={EDITOR_MIRRORS.OUTPUT_ID} />
    </>
  );
}
```

## Notes

- Dark/light theme is taken from `uiSettings` when creating CodeMirror.
- `use-setup` calls `lib/init.ts` (autocomplete, layout, API routes) and `send(..., true)` to render the welcome message.

