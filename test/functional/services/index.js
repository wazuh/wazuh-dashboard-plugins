import { ExtensionPopoverProvider } from './extension_popover';
import { AreaChartProvider } from './area_chart';
import { PieChartsProvider } from './pie_chart';
import { TableVizProvider } from './table_viz';
import { EsAreaChartProvider } from './es_area_chart';
import { EsPieChartProvider } from './es_pie_chart';
import { EsTableVizProvider } from './es_table_viz';
import { SortArrayProvider } from './sort_array';

export const services = {
  popOver: ExtensionPopoverProvider,
  areaChart: AreaChartProvider,
  pieCharts: PieChartsProvider,
  tableViz: TableVizProvider,
  esAreaChart: EsAreaChartProvider,
  esPieChart: EsPieChartProvider,
  esTableViz: EsTableVizProvider,
  sortArray: SortArrayProvider,
}