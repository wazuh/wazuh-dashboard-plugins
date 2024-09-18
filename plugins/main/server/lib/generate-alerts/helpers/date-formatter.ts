import { NumberFormatter } from './number-formatter';

export class DateFormatter {
  public static readonly LONG_MONTH_NAMES = [
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
  public static readonly SHORT_MONTH_NAMES = [
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
  public static readonly LONG_DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  public static readonly SHORT_DAY_NAMES = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  public static readonly DATE_FORMAT = {
    ISO_FULL: 'Y-M-DTh:m:s.lZ',
    FULL_HYPHENATED: 'Y-M-D-h-m-s-l',
    READABLE_FORMAT: 'E N D h:m:s.l Y',
    SHORT_READABLE_FORMAT: 'N D h:m:s',
    SLASHED_TIMESTAMP: 'D/N/Y:h:m:s +0000',
    ISO_TIMESTAMP: 'Y-M-DTh:m:s.l+0000',
    SHORT_DATE_TIME_SLASH: 'Y/M/D/h',
    COMPACT_DATE_TIME_HYPHENATED: 'Y-M-D-h-m-s',
  } as const;

  private static readonly tokens = {
    D: (date: Date) => NumberFormatter.pads(date.getDate(), 2), // 01-31
    // 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
    // 'Saturday'
    A: (date: Date) => DateFormatter.LONG_DAY_NAMES[date.getDay()],
    // 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
    E: (date: Date) => DateFormatter.SHORT_DAY_NAMES[date.getDay()],
    M: (date: Date) => NumberFormatter.pads(date.getMonth() + 1, 2), // 01-12
    // 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    // 'September', 'October', 'November', 'December'
    J: (date: Date) => DateFormatter.LONG_MONTH_NAMES[date.getMonth()],
    // 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
    // 'Nov', 'Dec'
    N: (date: Date) => DateFormatter.SHORT_MONTH_NAMES[date.getMonth()],
    Y: (date: Date) => date.getFullYear(), // 2020
    h: (date: Date) => NumberFormatter.pads(date.getHours(), 2), // 00-23
    m: (date: Date) => NumberFormatter.pads(date.getMinutes(), 2), // 00-59
    s: (date: Date) => NumberFormatter.pads(date.getSeconds(), 2), // 00-59
    l: (date: Date) => NumberFormatter.pads(date.getMilliseconds(), 3), // 000-999
  };

  /**
   * The function `format` formats a given date according to a specified format
   * string.
   * @param {Date} date - The `date` parameter in the `date` function is of type
   * `Date`, which represents a specific point in time. It can include the year,
   * month, day, hour, minute, second, and milliseconds.
   * @param [format] - The `format` parameter in the `date` function is used to
   * specify the format in which the date should be displayed. It is a string
   * that contains tokens representing different parts of the date (e.g.,
   * 'YYYY-MM-DD' for year-month-day format).
   * @returns The `date` function is returning the formatted date string based
   * on the provided format.
   */
  static format(date: Date, format: string) {
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
