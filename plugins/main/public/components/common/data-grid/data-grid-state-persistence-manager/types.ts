export interface DataGridState {
  columns: string[];
  columnsWidth: Record<string, number>;
  pageSize: number;
}

export interface DataGridStatePersistenceManager<T extends DataGridState> {
  retrieveState: (moduleId: string) => Partial<T> | null;
  persistState: (moduleId: string, payload: Partial<T>) => void;
  clearState: (moduleId: string) => void;
}
