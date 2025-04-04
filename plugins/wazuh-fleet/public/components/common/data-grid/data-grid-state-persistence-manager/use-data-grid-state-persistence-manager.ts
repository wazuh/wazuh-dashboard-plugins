import { DataGridState, DataGridStatePersistenceManager } from './types';

interface UseDataGridStateManagementProps<
  State extends DataGridState[keyof DataGridState],
> {
  stateManagement: DataGridStatePersistenceManager<State>;
  defaultState: State;
  validateState?: (state: State) => boolean;
}

const useDataGridStatePersistenceManager = <
  State extends DataGridState[keyof DataGridState],
>({
  stateManagement,
  defaultState,
  validateState,
}: UseDataGridStateManagementProps<State>) => {
  const clearState = (moduleId: string) => {
    stateManagement.clearState(moduleId);
  };

  const retrieveState = (moduleId: string): State => {
    const state = stateManagement.retrieveState(moduleId);
    let isValid = false;

    if (!state) {
      return defaultState;
    }

    try {
      isValid = validateState?.(state) || false;
    } catch (error) {
      console.error('Error validating state:', error);
      clearState(moduleId);
    }

    if (isValid) {
      return state;
    }

    return defaultState;
  };

  const persistState = (moduleId: string, payload: State): void => {
    stateManagement.persistState(moduleId, payload);
  };

  return {
    retrieveState,
    persistState,
    clearState,
  };
};

export default useDataGridStatePersistenceManager;
