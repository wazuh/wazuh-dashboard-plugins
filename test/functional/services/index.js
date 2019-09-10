import { ExtensionPopoverProvider } from './extension_popover';
import { AreaChartProvider } from './area_chart';
import { EsAreaChartProvider } from './es_area_chart';

export const services = {
  popOver: ExtensionPopoverProvider,
  areaChart: AreaChartProvider,
  esAreaChart: EsAreaChartProvider,
}