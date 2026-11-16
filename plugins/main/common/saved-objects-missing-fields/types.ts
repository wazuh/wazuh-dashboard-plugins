export type FieldUsage = 'query' | 'filter' | 'aggregation' | 'column' | 'sort';

export interface MissingField {
  field: string;
  usedIn: FieldUsage[];
}

export interface MissingFieldsReport {
  id: string;
  type: string;
  title: string;
  indexPatternId: string;
  indexPatternTitle: string;
  missing: MissingField[];
}
