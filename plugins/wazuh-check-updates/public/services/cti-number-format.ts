import { formatNumberWithSettings } from '../../common/number-format';
import { getCore } from '../plugin-services';

/**
 * A number of the CTI feed as the advanced settings format numbers. See
 * `formatNumberWithSettings`.
 */
export const formatCtiNumber = (value: number): string =>
  formatNumberWithSettings(value, key => getCore().uiSettings.get(key));
