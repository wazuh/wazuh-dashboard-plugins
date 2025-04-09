export interface DataGridState {
  columns: string[];
  columnsWidth: Record<string, number>;
  pageSize: number;
}

export type DataGridStatePersistenceManager<T extends DataGridState> = (
  moduleId: string,
) => {
  retrieveState: () => Partial<T> | null;
  persistState: (payload: Partial<T>) => void;
  clearState: () => void;
};
