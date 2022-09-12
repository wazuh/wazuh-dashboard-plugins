export interface ColumnProps {
  field?: string;
  name?: string;
  align?: string;
  sortable?: boolean;
  width?: string;
  render?: Function | undefined
}

export interface Columns {
  decoders?: Array<ColumnProps>;
  rules?: Array<ColumnProps>;
  lists?: Array<ColumnProps>;
  files?: Array<ColumnProps>;
}