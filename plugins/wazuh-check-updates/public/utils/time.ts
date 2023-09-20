import moment from 'moment-timezone';
import { getUiSettings } from '../plugin-services';

export const formatUIDate = (date: Date) => {
  const dateFormat = getUiSettings().get('dateFormat');
  const timezone = getTimeZone();
  const momentDate = moment(date);
  momentDate.tz(timezone);
  return momentDate.format(dateFormat);
};
const getTimeZone = () => {
  const dateFormatTZ = getUiSettings().get('dateFormat:tz');
  const detectedTimezone = moment.tz.guess();
  return dateFormatTZ === 'Browser' ? detectedTimezone : dateFormatTZ;
};
