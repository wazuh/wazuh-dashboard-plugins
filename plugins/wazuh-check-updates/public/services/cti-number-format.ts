import { formatNumberWithSettings } from '../../common/number-format';
import { getFieldFormats } from '../plugin-services';

/** Id of the number format of the `data` plugin. */
const NUMBER_FORMAT_ID = 'number';

/**
 * A number of the CTI feed as the advanced settings format numbers, with the number
 * format of the `data` plugin. See `formatNumberWithSettings`.
 */
export const formatCtiNumber = (value: number): string =>
  formatNumberWithSettings(value, () =>
    getFieldFormats().getInstance(NUMBER_FORMAT_ID),
  );
