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

/**
 * A count as the advanced settings format numbers (`format:number:defaultPattern` and
 * `format:number:defaultLocale`), the standard for every Home number.
 */
export const formatHomeNumber = (value: number): string =>
  getPublishedFormatNumber()?.(value) ??
  convertWithFieldFormat('number', value) ??
  formatUINumber(value);

/**
 * A ratio (0.5 = 50%) as the advanced settings format percentages (`format:percent:defaultPattern`
 * and `format:number:defaultLocale`).
 */
export const formatHomePercent = (ratio: number): string =>
  convertWithFieldFormat('percent', ratio) ?? decimalFormat().convert(ratio);
