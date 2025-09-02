# DevTools · Hints (Autocomplete)

CodeMirror integration that provides autocomplete for endpoints, query params, and body keys. It relies on a dictionary built from `/api/routes` loaded into `editorInput.model`.

## Structure

- `autocomplete.ts`: Overrides `CodeMirror.commands.autocomplete` to use the dictionary provider.
- `dictionary-hint.ts`: Registers the CodeMirror `hint` helper that delegates to a provider.
- `dictionary/`: Dictionary provider (context, strategies, types, and utilities).

## Primary Usage

- Ensure and register autocomplete during editor setup:

```ts
import { ensureAutocompleteCommand } from './hints/autocomplete';
import { registerDictionaryHint } from './hints/dictionary-hint';

ensureAutocompleteCommand();
registerDictionaryHint(editorInput);
```

- The provider reads `editorInput.model` (available routes) and the current editor context to propose hints.

## Dependencies

- Internal: `grouping` (to locate the active group and request line), `dictionary/*`.
- External: CodeMirror (showHint API).

## Testing

- Tests in `hints/*.test.ts` and `hints/dictionary/*.test.ts`.
- Run from `plugins/main`:
  ```bash
  yarn test:jest
  ```

## Example

Autocomplete on keyup (already configured in `lib/init.ts`):

```ts
editorInput.on('keyup', (cm, e) => {
  cm.execCommand('autocomplete', null, { completeSingle: false });
});
```

## Notes

- Excluded trigger keys are defined in `excluded-devtools-autocomplete-keys.ts`.
- If `editorInput.model` is empty, the provider will return an empty list.

