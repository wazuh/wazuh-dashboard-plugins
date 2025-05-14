interface Style {
  bgFill: string;
  bgColor: boolean;
  labelColor: boolean;
  subText: string;
  fontSize: number;
}

interface ColorsRange {
  from: number;
  to: number;
}

interface Label {
  show: boolean;
}

interface Metric {
  percentageMode: boolean;
  useRanges: boolean;
  colorSchema: string;
  metricColorMode: string;
  colorsRange: ColorsRange[];
  labels: Label;
  invertColors: boolean;
  style: Style;
}

interface SavedVisQueryLanguage {
  query: string;
  language: string;
}

interface SavedVisParamsSeriesMetric {
  id: string;
  type: string;
  numerator: SavedVisQueryLanguage;
  denominator: SavedVisQueryLanguage;
  metric_agg: string;
}

interface SavedVisParamsSeries {
  id: string;
  color: string;
  split_mode: string;
  split_color_mode: string;
  metrics: SavedVisParamsSeriesMetric[];
  separate_axis?: number;
  axis_position: string;
  axis_scale: string;
  formatter: string;
  chart_type: string;
  line_width: number;
  point_size: number;
  fill: number;
  stacked: string;
  label: string;
  filter: SavedVisQueryLanguage;
  value_template: string;
  offset_time: string;
}

interface SavedVisParams {
  type: string;
  id?: string;
  metric?: Metric;
  addTooltip?: boolean;
  addLegend?: boolean;
  series?: SavedVisParamsSeries[];
  time_field?: string;
  index_pattern?: string;
  interval?: string;
  axis_position?: string;
  axis_formatter?: string;
  axis_scale?: string;
  show_legend?: number;
  show_grid?: number;
  tooltip_mode?: string;
  default_index_pattern?: string;
  default_timefield?: string;
  isModelInvalid?: boolean;
  background_color_rules?: [
    {
      id: string;
    },
  ];
  filter?: SavedVisQueryLanguage;
  time_range_mode?: string;
  bar_color_rules?: [
    {
      id: string;
    },
  ];
}

interface SavedVisDataReferences<T extends string = string> {
  name: string;
  type: string;
  id: T;
}

interface SavedVisData<T extends string = string> {
  searchSource: {
    query: {
      language: string;
      query: string;
    };
    filter: any[];
  } & (
    | {
        index: T;
      }
    | {
        indexRef: string;
      }
  );
  references: SavedVisDataReferences<T>[];
  aggs: any[];
}

export interface SavedVis {
  id: string;
  title: string;
  type: string;
  params: SavedVisParams;
  data: SavedVisData;
}
