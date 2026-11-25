import {
  getDataPlugin,
  getWazuhCheckUpdatesPlugin,
} from '../../../../../kibana-services';
import { formatUINumber } from '../../../../../react-services/format-number';
import { decimalFormat } from '../../utils/helpers';

/**
 * A count as the advanced settings format numbers (`format:number:defaultPattern` and
 * `format:number:defaultLocale`), the standard for every Home number: the `formatNumber` that
 * `wazuh-check-updates` publishes (`formatNumberWithSettings`). Whole numbers show no decimals.
 */
export const formatHomeNumber = (value: number): string => {
  try {
    return getWazuhCheckUpdatesPlugin().formatNumber(value);
  } catch {
    // The plugin is not set yet, as in unit tests.
    return formatUINumber(value);
  }
};

/**
 * A ratio (0.5 = 50%) as the advanced settings format percentages (`format:percent:defaultPattern`
 * and `format:number:defaultLocale`), through the `data` plugin's percent format.
 */
export const formatHomePercent = (ratio: number): string => {
  try {
    const formatted = getDataPlugin()
      .fieldFormats.getInstance('percent')
      .convert(ratio);
    if (typeof formatted === 'string' && formatted !== '') {
      return formatted;
    }
  } catch {
    // The data plugin is not set yet, as in unit tests.
  }
  return decimalFormat().convert(ratio);
};
