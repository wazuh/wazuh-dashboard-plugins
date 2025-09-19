import { AppState } from '../../../../../../react-services';

/**
 * Minimal interface to persist current DevTools editor state.
 */
export interface CurrentStateStore {
  setCurrentDevTools(value: string): void;
}

export class DefaultCurrentStateStore implements CurrentStateStore {
  setCurrentDevTools(value: string): void {
    AppState.setCurrentDevTools(value);
  }
}
