import { NumberFormat } from '../../../../src/plugins/data/common';
import { getCore } from '../plugin-services';

const browserNumberFormat = new Intl.NumberFormat();

/**
 * A number as the advanced settings format numbers (`format:number:defaultPattern`
 * and `format:number:defaultLocale`), like the rest of the dashboard. Falls back to
 * the browser locale when the settings cannot be read.
 */
export function formatCtiNumber(value: number): string {
  try {
    const { uiSettings } = getCore();
    const format = new NumberFormat({}, (key: string) => uiSettings.get(key));
    const formatted = format.convert(value);
    if (typeof formatted === 'string' && formatted !== '') {
      return formatted;
    }
  } catch {
    // Settings not available (e.g. before the core is set): fall back below.
  }
  return browserNumberFormat.format(value);
}
