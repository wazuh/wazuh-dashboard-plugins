import moment from 'moment-timezone';
import { getUiSettings } from '../kibana-services';

export class TimeService {
  /**
   * Returns given date adding the timezone offset
   * @param {string} date Date
   */
  static offset(d) {
    try {
      const dateUTC = moment.utc(d);
      const kibanaTz = getUiSettings().get('dateFormat:tz');
      const dateLocate =
        kibanaTz === 'Browser'
          ? moment(dateUTC).local()
          : moment(dateUTC).tz(kibanaTz);
      return dateLocate.format('YYYY/MM/DD HH:mm:ss');
    } catch (error) {
      throw new Error(error);
    }
  }
}