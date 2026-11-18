import { NumberFormat } from '../../../../src/plugins/data/common';
import { getCore } from '../plugin-services';

const browserNumberFormat = new Intl.NumberFormat();

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Drops the decimal part of a whole number when the pattern adds one that is only
 * zeros ("602.00" → "602", "952 987,00" → "952 987", "953.0k" → "953k"). The decimal
 * separator of the configured locale is read from how the same format writes 1.5.
 */
function dropZeroDecimals(formatted: string, format: NumberFormat): string {
  const probe = format.convert(1.5);
  const separator =
    typeof probe === 'string' ? /1(\D+)5/.exec(probe)?.[1] : null;
  if (!separator) {
    return formatted;
  }
  return formatted.replace(
    new RegExp(`${escapeRegExp(separator)}0+(?=\\D*$)`),
    '',
  );
}

/**
 * A number as the advanced settings format numbers (`format:number:defaultPattern`
 * and `format:number:defaultLocale`), like the rest of the dashboard. A whole number
 * shows no decimals even when the pattern adds them: counts have none. Falls back to
 * the browser locale when the settings cannot be read.
 */
export function formatCtiNumber(value: number): string {
  try {
    const { uiSettings } = getCore();
    const format = new NumberFormat({}, (key: string) => uiSettings.get(key));
    const formatted = format.convert(value);
    if (typeof formatted === 'string' && formatted !== '') {
      return Number.isInteger(value)
        ? dropZeroDecimals(formatted, format)
        : formatted;
    }
  } catch {
    // Settings not available (e.g. before the core is set): fall back below.
  }
  return browserNumberFormat.format(value);
}
