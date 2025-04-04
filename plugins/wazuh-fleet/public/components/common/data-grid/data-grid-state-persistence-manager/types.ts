export interface DataGridState {
  columns: string[];
  columnsWidth: Record<string, number>;
  pageSize: number;
}

export interface DataGridStatePersistenceManager<
  T extends DataGridState[keyof DataGridState],
> {
  retrieveState: (moduleId: string) => T | null;
  persistState: (moduleId: string, payload: T) => void;
  clearState: (moduleId: string) => void;
}
