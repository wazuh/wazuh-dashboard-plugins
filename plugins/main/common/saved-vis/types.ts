export interface SearchSourceQueryLanguage {
  query: string;
  language: string;
}

export interface DataSearchSource {
  query: SearchSourceQueryLanguage;
  filter: any[];
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

export interface DashboardByValueSavedVis {
  id: string;
  title?: string;
  type: string;
  params: Record<string, any>;
  uiState?: Record<string, any>;
  data: SavedVisData;
}

export interface DashboardByValuePanels {
  w: number;
  h: number;
  x: number;
  y: number;
  savedVis: DashboardByValueSavedVis;
}

export interface DashboardByValueInput {
  id: string;
  title: string;
  description: string;
  panels: DashboardByValuePanels[];
  useMargins: boolean;
  hidePanelTitles: boolean;
}
