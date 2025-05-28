export interface DataGridState {
  columns: string[];
  columnWidths: Record<string, number>;
  pageSize: number;
}

export type DataGridStatePersistenceManager<
  T extends DataGridState = DataGridState,
> = (moduleId: string) => {
  retrieveState: () => Partial<T> | null;
  persistState: (payload: Partial<T>) => void;
  clearState: () => void;
};
