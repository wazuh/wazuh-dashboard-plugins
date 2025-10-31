type JSONString = string;
type DateString = string;
type VersionString = `${number}.${number}.${number}`;

interface SavedObjectMeta {
  searchSourceJSON: JSONString;
}

interface Reference {
  id: string;
  name: string;
  type: string;
}

interface GenericAttributes {
  title: string;
  description?: string;
  version?: number;
  [key: string]: any;
}

interface AttributesVisualization extends GenericAttributes {
  kibanaSavedObjectMeta: SavedObjectMeta;
  uiStateJSON: JSONString;
  visState: JSONString;
}

interface AttributesDashboard extends GenericAttributes {
  kibanaSavedObjectMeta: SavedObjectMeta;
  hits: number;
  optionsJSON: JSONString;
  panelsJSON: JSONString;
  timeRestore: boolean;
}

interface SavedObject {
  attributes: GenericAttributes;
  id: string;
  references: Reference[];
  updated_at?: string;
  version?: string;
}

interface SavedObjectIndexPattern extends SavedObject {
  migrationVersion?: { 'index-pattern': VersionString };
}

interface SavedObjectVisualization extends SavedObject {
  migrationVersion?: { visualization: VersionString };
}

interface SavedObjectDashboard extends SavedObject {
  migrationVersion?: { dashboard: VersionString };
}
