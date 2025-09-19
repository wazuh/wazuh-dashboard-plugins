# DevTools · Types (UI / Keys)

Constants and helpers related to UI key handling (e.g., Ctrl/Cmd + Enter to execute).

## Structure

- `keys.ts`: Key code map and helpers (`isEnter`, `hasCtrlOrCmd`).

## Primary Usage

```ts
import { Keys, isEnter, hasCtrlOrCmd } from './keys';

window.addEventListener('keydown', (ev: any) => {
  if (isEnter(ev) && hasCtrlOrCmd(ev)) {
    // execute action
  }
});
```

## Notes

- Used by `application/hooks/use-hotkey-for-dev-tools.ts` to trigger `send`.
