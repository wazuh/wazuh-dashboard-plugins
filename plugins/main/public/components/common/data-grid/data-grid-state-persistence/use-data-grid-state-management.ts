import { DataGridState, DataGridStateManagement } from './types';

interface UseDataGridStateManagementProps<
  State extends DataGridState[keyof DataGridState],
> {
  stateManagement: DataGridStateManagement<State>;
  validateState?: (state: State) => boolean;
}

const useDataGridStateManagement = <
  State extends DataGridState[keyof DataGridState],
>({
  stateManagement,
  validateState,
}: UseDataGridStateManagementProps<State>) => {
  const retrieveState = (moduleId: string): State | null => {
    const state = stateManagement.retrieveState(moduleId);
    if (state && validateState?.(state)) {
      return state;
    }
    return null;
  };

  const persistState = (moduleId: string, payload: State): void => {
    stateManagement.persistState(moduleId, payload);
  };

  const clearState = (moduleId: string) => {
    stateManagement.clearState(moduleId);
  };

  return {
    retrieveState,
    persistState,
    clearState,
  };
};

export default useDataGridStateManagement;
