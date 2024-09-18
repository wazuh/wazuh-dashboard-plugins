const { NumberFormatter } = require('./number-formatter');

class DateFormatter {
  static LONG_MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  static SHORT_MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  static LONG_DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  static SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  static DATE_FORMAT = {
    ISO_FULL: 'Y-M-DTh:m:s.lZ',
    FULL_HYPHENATED: 'Y-M-D-h-m-s-l',
    READABLE_FORMAT: 'E N D h:m:s.l Y',
    SHORT_READABLE_FORMAT: 'N D h:m:s',
    SLASHED_TIMESTAMP: 'D/N/Y:h:m:s +0000',
    ISO_TIMESTAMP: 'Y-M-DTh:m:s.l+0000',
    SHORT_DATE_TIME_SLASH: 'Y/M/D/h',
    COMPACT_DATE_TIME_HYPHENATED: 'Y-M-D-h-m-s',
  };

  static tokens = {
    D: (/** @type {Date} */ date) => NumberFormatter.pads(date.getDate(), 2), // 01-31
    // 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
    // 'Saturday'
    A: (/** @type {Date} */ date) =>
      DateFormatter.LONG_DAY_NAMES[date.getDay()],
    // 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
    E: (/** @type {Date} */ date) =>
      DateFormatter.SHORT_DAY_NAMES[date.getDay()],
    M: (/** @type {Date} */ date) =>
      NumberFormatter.pads(date.getMonth() + 1, 2), // 01-12
    // 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    // 'September', 'October', 'November', 'December'
    J: (/** @type {Date} */ date) =>
      DateFormatter.LONG_MONTH_NAMES[date.getMonth()],
    // 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
    // 'Nov', 'Dec'
    N: (/** @type {Date} */ date) =>
      DateFormatter.SHORT_MONTH_NAMES[date.getMonth()],
    Y: (/** @type {Date} */ date) => date.getFullYear(), // 2020
    h: (/** @type {Date} */ date) => NumberFormatter.pads(date.getHours(), 2), // 00-23
    m: (/** @type {Date} */ date) => NumberFormatter.pads(date.getMinutes(), 2), // 00-59
    s: (/** @type {Date} */ date) => NumberFormatter.pads(date.getSeconds(), 2), // 00-59
    l: (/** @type {Date} */ date) =>
      NumberFormatter.pads(date.getMilliseconds(), 3), // 000-999
  };

  /**
   * The function `format` formats a given date according to a specified format
   * string.
   * @param {Date} date - The `date` parameter in the `date` function is of type
   * `Date`, which represents a specific point in time. It can include the year,
   * month, day, hour, minute, second, and milliseconds.
   * @param {string} format - The `format` parameter in the `date` function is used to
   * specify the format in which the date should be displayed. It is a string
   * that contains tokens representing different parts of the date (e.g.,
   * 'YYYY-MM-DD' for year-month-day format).
   * @returns {string} The `date` function is returning the formatted date string based
   * on the provided format.
   */
  static format(date, format) {
    let result = '';
    const tokens = format.split('');

    for (const token of tokens) {
      if (DateFormatter.tokens[token]) {
        result += DateFormatter.tokens[token](date);
      }
      result += token;
    }

    return result;
  }
}

module.exports.DateFormatter = DateFormatter;
