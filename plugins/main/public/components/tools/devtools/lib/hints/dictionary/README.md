# DevTools · Dictionary Provider (Hints)

Provider that builds suggestions based on an API model (`DevToolsModel`) and the editor context. It uses a strategy‑based architecture to handle different cases (request line, JSON body, fallback).

## Structure

- `types.ts`: Model types (`DevToolsModel`, `MethodDef`, `EndpointDef`, `HintItem`).
- `context.ts`: Context computation (cursor, current group, detected endpoint, etc.).
- `constants.ts`: Classes/labels used for hint rendering.
- `hint-provider.ts`: Orchestrates strategies and handles errors.
- `factory.ts`: Factory that wires default strategies.
- `strategies/`:
  - `RequestLineHintStrategy`: suggests method/endpoint/path segments.
  - `BodyHintStrategy`: suggests body keys from schema.
  - `FallbackHintStrategy`: basic alternatives when others don’t apply.
- `utils/`: helpers for parsing/rendering/sorting.

## Primary Usage

Instantiate the provider (normally via `registerDictionaryHint`):

```ts
import { createDictionaryHintProvider } from './dictionary/factory';

const provider = createDictionaryHintProvider({
  analyzeGroups,
  calculateWhichGroup,
  logError: (ctx, err) => {/* delegate to Error Orchestrator */},
  getModel: () => editorInput.model,
});

const items = provider.buildHints(editor, currentLine, currentWord);
```

## Dependencies

- Internal: `grouping` to obtain the active group and request line; local utilities.
- External: CodeMirror (for `Pos` and item rendering).

## Testing

- Unit tests in `hint-provider.test.ts` and strategies.
- Run from `plugins/main`:
  ```bash
  yarn test:jest
  ```

## Extension Example

Add a custom strategy:

```ts
import type { HintStrategy, HintContext } from './strategies/hint-strategy';

class MyStrategy implements HintStrategy {
  canHandle(ctx: HintContext) { return ctx.isInsideBodyBlock; }
  getHints(ctx: HintContext) { return [{ text: 'my.custom.key' }]; }
}

const provider = new DictionaryHintProvider(deps, [
  new MyStrategy(),
  // ...default strategies
]);
```

## Notes

- The `DevToolsModel` is obtained from `/api/routes` and can include `documentation`, `description`, etc., in addition to `query` and `body`.
- Strategy order determines suggestion priority.

