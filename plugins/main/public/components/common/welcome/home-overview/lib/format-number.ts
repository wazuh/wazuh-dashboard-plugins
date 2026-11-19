import {
  getDataPlugin,
  getWazuhCheckUpdatesPlugin,
} from '../../../../../kibana-services';
import { formatUINumber } from '../../../../../react-services/format-number';
import { decimalFormat } from '../../utils/helpers';

type FormatNumber = (value: number) => string;

/**
 * `formatNumber` published by `wazuh-check-updates` (its `formatNumberWithSettings`), read from
 * the start contract so this plugin imports nothing from it. Absent on a version that does not
 * publish it.
 */
const getPublishedFormatNumber = (): FormatNumber | undefined => {
  try {
    const { formatNumber } = getWazuhCheckUpdatesPlugin() as {
      formatNumber?: unknown;
    };
    return typeof formatNumber === 'function'
      ? (formatNumber as FormatNumber)
      : undefined;
  } catch {
    return undefined;
  }
};

/** A value through a field format of the `data` plugin, which reads the advanced settings. */
const convertWithFieldFormat = (
  formatId: 'number' | 'percent',
  value: number,
): string | undefined => {
  try {
    const formatted = getDataPlugin()
      .fieldFormats.getInstance(formatId)
      .convert(value);
    return typeof formatted === 'string' && formatted !== ''
      ? formatted
      : undefined;
  } catch {
    return undefined;
  }
};

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Drops the zero decimals a pattern adds to a whole number ("235.00" → "235", "1 234,00" →
 * "1 234"), as `formatNumberWithSettings` does. The decimal separator of the locale is read from
 * how the same format writes 1.5.
 */
const dropZeroDecimals = (formatted: string): string => {
  const probe = convertWithFieldFormat('number', 1.5);
  const separator = probe ? /1(\D+)5/.exec(probe)?.[1] : undefined;
  return separator
    ? formatted.replace(new RegExp(`${escapeRegExp(separator)}0+(?=\\D*$)`), '')
    : formatted;
};

/** The `data` plugin's number format; whole numbers show no decimals, counts have none. */
const convertCount = (value: number): string | undefined => {
  const formatted = convertWithFieldFormat('number', value);
  return formatted !== undefined && Number.isInteger(value)
    ? dropZeroDecimals(formatted)
    : formatted;
};

/**
 * A count as the advanced settings format numbers (`format:number:defaultPattern` and
 * `format:number:defaultLocale`), the standard for every Home number.
 */
export const formatHomeNumber = (value: number): string =>
  getPublishedFormatNumber()?.(value) ??
  convertCount(value) ??
  formatUINumber(value);

/**
 * A ratio (0.5 = 50%) as the advanced settings format percentages (`format:percent:defaultPattern`
 * and `format:number:defaultLocale`).
 */
export const formatHomePercent = (ratio: number): string =>
  convertWithFieldFormat('percent', ratio) ?? decimalFormat().convert(ratio);
