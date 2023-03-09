from datetime import datetime, date, tzinfo, timedelta
import time as _time
import calendar

'''
All datetimes are saved as utc time  the calls is utc

ex: datetime.utcnow().replace(tzinfo=utc)

The catch is that all dates are based on local time. The reasoning is daily reports are done as a local report. But
having datetime in UTC there is no confusion between machines
'''

ZERO = timedelta(0)
HOUR = timedelta(hours=1)


# A UTC class.
class UTC(tzinfo):
    """UTC"""

    def utcoffset(self, dt):
        return ZERO

    def tzname(self, dt):
        return "UTC"

    def dst(self, dt):
        return ZERO


utc = UTC()

# A class capturing the platform's idea of local time.
STDOFFSET = timedelta(seconds=-_time.timezone)
if _time.daylight:
    DSTOFFSET = timedelta(seconds=-_time.altzone)
else:
    DSTOFFSET = STDOFFSET

DSTDIFF = DSTOFFSET - STDOFFSET


class LocalTimezone(tzinfo):
    def utcoffset(self, dt):
        if self._isdst(dt):
            return DSTOFFSET
        else:
            return STDOFFSET

    def dst(self, dt):
        if self._isdst(dt):
            return DSTDIFF
        else:
            return ZERO

    def tzname(self, dt):
        return _time.tzname[self._isdst(dt)]

    def _isdst(self, dt):
        tt = (dt.year, dt.month, dt.day,
              dt.hour, dt.minute, dt.second,
              dt.weekday(), 0, 0)
        stamp = _time.mktime(tt)
        tt = _time.localtime(stamp)
        return tt.tm_isdst > 0


local = LocalTimezone()


def date_to_timestamp(dateObj):
    '''
    takes different time formats and returns a utc timestamp in seconds as integer
    '''
    # convert datetime to utc time
    if isinstance(dateObj, datetime):
        if not dateObj.tzinfo:
            dateObj = dateObj.replace(tzinfo=utc)
        return int(calendar.timegm(dateObj.astimezone(utc).timetuple()))
    # convert date to midnight local time
    if isinstance(dateObj, date):
        dateObj = datetime.combine(dateObj, datetime.min.time()).replace(tzinfo=local)
        return int(calendar.timegm(dateObj.astimezone(utc).timetuple()))

    # floating point and int is assumed to be UTC
    if isinstance(dateObj, float):
        return int(float(dateObj))
    if isinstance(dateObj, int):
        return int(dateObj)

    return 0


def datetime_to_date(dateObj):
    result = dateObj.astimezone(local)
    return result.date()


def date_to_datetime(dateObj):
    result = date_to_timestamp(dateObj)
    return datetime.utcfromtimestamp(result).replace(tzinfo=utc)


def date_to_timestamp_str(dateObj):
    return "%d" % date_to_timestamp(dateObj)


def localNow():
    return datetime.now(local)


def utcNow():
    return datetime.utcnow().replace(tzinfo=utc)


def get_time():
    return _time.gmtime()


def local_date_to_utc(date, time):
    return datetime.combine(date, time).replace(tzinfo=local).astimezone(utc)


# date is always based on local machine timezone
def today():
    return date.today()


def str_to_date(string):
    '''
    Expects a YYYY-MM-DD string, returns a date object.
    '''
    return date(*[int(x) for x in string.split('-')])


def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""

    if isinstance(obj, date):
        serial = obj.isoformat()
        return serial
    if isinstance(obj, datetime):
        serial = obj.isoformat()
        return serial

    raise TypeError("Type not serializable")
