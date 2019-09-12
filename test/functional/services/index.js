import { ExtensionPopoverProvider } from './extension_popover';
import { AreaChartProvider } from './area_chart';
import { PieChartsProvider } from './pie_chart';
import { EsAreaChartProvider } from './es_area_chart';
import { EsPieChartProvider } from './es_pie_chart';

export const services = {
  popOver: ExtensionPopoverProvider,
  areaChart: AreaChartProvider,
  pieCharts: PieChartsProvider,
  esAreaChart: EsAreaChartProvider,
  esPieChart: EsPieChartProvider,
}