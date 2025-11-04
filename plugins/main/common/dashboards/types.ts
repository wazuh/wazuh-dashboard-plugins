export interface SearchSourceQuery {
  query: string;
  language: string;
}

export interface DataSearchSource {
  query: SearchSourceQuery;
  filter?: any[];
  index: string;
}

export interface DataReferences {
  name: string;
  type: string;
  id: string;
}

export interface SavedVisData {
  searchSource: DataSearchSource;
  references: DataReferences[];
  aggs: any[];
}

export interface SavedVis {
  id: string;
  title?: string;
  type: string;
  params: Record<string, any>;
  uiState?: Record<string, any>;
  data: SavedVisData;
}

export type GridData = { w: number; h: number; x: number; y: number };

export interface DashboardByRendererPanel<T extends string = string> {
  gridData: GridData & { i: T };
  type: 'visualization';
  explicitInput: {
    id: T;
    savedVis: SavedVis;
  };
}

export type DashboardByRendererPanels<T extends string = string> = Record<
  T,
  DashboardByRendererPanel<T>
>;

export interface DashboardByRendererInput {
  id: string;
  title: string;
  description: string;
  panels: DashboardByRendererPanels;
}

export type GridDataVisualizationPair = {
  gridData: GridData;
  savedVis: SavedVis;
};
