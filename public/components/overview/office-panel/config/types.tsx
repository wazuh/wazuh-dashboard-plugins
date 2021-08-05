interface IOfficeConfigItem {
    width?: number;
    height?: number;
}

export interface IOfficeConfigColumn extends IOfficeConfigItem {
  component: React.ElementType;
}

export interface IOfficeConfigRow extends IOfficeConfigItem {
  columns: IOfficeConfigColumn[];
}

export interface IOfficeConfig {
  rows: IOfficeConfigRow[];
}
