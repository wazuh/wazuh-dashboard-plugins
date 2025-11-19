export type JSONString = string;
export type DateString = string;
export type VersionString = `${number}.${number}.${number}`;

export interface SavedObjectMeta {
  searchSourceJSON: JSONString;
}

export interface Reference {
  id: string;
  name: string;
  type: string;
}

export interface GenericAttributes {
  title: string;
  description?: string;
  version?: number;
  [key: string]: any;
}

export interface AttributesVisualization extends GenericAttributes {
  kibanaSavedObjectMeta: SavedObjectMeta;
  uiStateJSON: JSONString;
  visState: JSONString;
}

export interface AttributesDashboard extends GenericAttributes {
  kibanaSavedObjectMeta: SavedObjectMeta;
  hits: number;
  optionsJSON: JSONString;
  panelsJSON: JSONString;
  timeRestore: boolean;
}

export interface SavedObject {
  attributes: GenericAttributes;
  id: string;
  references: Reference[];
  type: string;
  updated_at?: DateString;
  version?: string;
  namespaces?: string[];
}

export interface SavedObjectIndexPattern extends SavedObject {
  type: 'index-pattern';
  migrationVersion?: { 'index-pattern': VersionString };
}

export interface SavedObjectVisualization extends SavedObject {
  type: 'visualization';
  migrationVersion?: { visualization: VersionString };
}

export interface SavedObjectDashboard extends SavedObject {
  type: 'dashboard';
  migrationVersion?: { dashboard: VersionString };
}
