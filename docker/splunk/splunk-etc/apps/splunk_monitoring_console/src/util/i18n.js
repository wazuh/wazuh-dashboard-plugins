/**
** i18n / L10n support routines
*/



/**
* Translate a simple string
*/
function _(message) {
    if (!message) return message;
    if (message.length == 0) return message;
    if (_i18n_locale.locale_name == 'en_DEBUG') return __debug_trans_str(message);
    var entry = _i18n_catalog['+-'+message];

    // check also for the case where message is the singular of a pluralized translation
    //  in that case, the key will be '0-message' instead of '+-message'
    if (entry == undefined) {
        entry = _i18n_catalog['0-'+message];
    }

    return entry == undefined ? message : entry;
}

// create a more verbose pointer to the translate function in case of naming collisions with '_'
var gettext = _;

/**
* Translate a string containing a number
*
* Eg. ungettext('Delete %(files)d file?', 'Delete %(files)d files?', files)
* Use in conjuction with sprintf():
*   sprintf( ungettext('Delete %(files)d file?', 'Delete %(files)d files?', files), { files: 14 } )
*/
function ungettext(msgid1, msgid2, n) {
    if (_i18n_locale.locale_name == 'en_DEBUG') return __debug_trans_str(msgid1);
    var pluralForm = _i18n_plural(n);
    //added this IF to normalize/cast the return value from the plural function to an int. see SPL-56112
    if(typeof pluralForm === 'boolean'){
        pluralForm = pluralForm ? 1 : 0;
    }
    var id = ''+pluralForm+'-'+msgid1;
    var entry = _i18n_catalog[id];
    return entry == undefined ? (n==1 ? msgid1 : msgid2)  : entry;
}


function __debug_trans_str(str) {
    var parts = str.split(/(\%(:?\(\w+\))?\w)|(<[^>]+>)|(\s+)/);
    parts = parts.filter(function(en) { return en!==undefined; });
    var result = [];
    for(var i=0; i<parts.length; i++) {
        var startsWithSpace = /^\s+/.test(parts[i]);
        if (i && parts[i-1].substr(0, 2)=='%(')
            continue;
        if (parts[i][0] == '%')
            result.push('**'+parts[i]+'**');
        else if (parts[i][0] == '<' || startsWithSpace)
            result.push(parts[i]);
         else
            result.push('\u270c'.repeat(parts[i].length));
    }
    return result.join('');
}

// Locale routines

/**
* Format a number according to the current locale
* The default format for en_US is #,##0.###
* See http://babel.edgewall.org/wiki/Documentation/numbers.html for details on format specs
*/
function format_decimal(num, format) {
    if (!format)
        format = _i18n_locale['number_format'];
    var pattern = parse_number_pattern(format);
    if (_i18n_locale.locale_name == 'en_DEBUG')
        return pattern.apply(num).replace(/\d/g, '0');
    else
        return pattern.apply(num);
}

format_number = format_decimal; // Maintain parity with the Python library

/**
* Format a percentage
*/
function format_percent(num, format) {
    if (!format)
        format = _i18n_locale['percent_format'];
    var pattern = parse_number_pattern(format);
    pattern.frac_prec = [0, 3]; // Appserver has standardized on between 0 and 3 decimal places for percentages
    return pattern.apply(num);
}

/**
* Format a number in scientific notation
*/
function format_scientific(num, format) {
    if (!format)
        format = _i18n_locale['scientific_format'];
    var pattern = parse_number_pattern(format);
    return pattern.apply(num);
}


/**
* Format a date according to the user's current locale
*
* standard formats (en-US examples):
* short: 1/31/08
* medium: Jan 31, 2008
* long: January 31, 2008
* full: Thursday, January 31, 2008
*
* Custom format can also be used
*
* @date Date object or unix timestamp or null for current time
* @format format specifier ('short', 'medium', 'long', 'full', 'MMM d, yyyy', etc)
*/
function format_date(date, format) {
    if (!date)
        date = new Date();
    if (Splunk.util.isInt(date)) {
        date = new Date(date*1000);
    }
    if (!format)
        format = 'medium';
    if (['full','long','medium','short'].indexOf(format)!==-1)
        format = get_date_format(format);
    var pattern = parse_datetime_pattern(format);
    return pattern.apply(new DateTime(date), _i18n_locale);
}


/**
* Format a date and time according to the user's current locale
*
* standard formats (en-US examples)
* short: 1/31/08 10:00 AM
* medium: Jan 31, 2008 10:00:00 AM
* long: January 31, 2008 10:00:00 AM
* full: Thursday, January 31, 2008 10:00:00 AM
*
* Custom format can also be used
*
* @date Date object or unix timestamp or null for current time
* @format format specifier ('short', 'medium', 'long', 'full', 'MMM d, yyyy', etc)
*/
function format_datetime(datetime, date_format, time_format) {
    if (datetime == undefined)
        datetime = new Date();
    if (Splunk.util.isInt(datetime)) {
        datetime = new Date(datetime*1000);
    }
    datetime = new DateTime(datetime);
    if (!date_format)
        date_format = 'medium';
    if (!time_format)
        time_format = date_format;
    var td_format = get_datetime_format(date_format);
    return td_format.replace('{0}', format_time(datetime, time_format)).replace('{1}', format_date(datetime, date_format));
}

/**
* Format a time according to the user's current locale
*
* NOTE: Time is automatically translated to the user's timezone
*
* standard formats (en-US only defines short/medium)
* short: 10:00 AM
* medium: 10:00:00 AM
*
* other locales may also define long/full and may use 24 hour time, etc
*
* @time An object of class Time (see below), or a Date object or null for current time
* @format format specifier ('short', 'medium', 'long', 'full', 'h:mm:ss a', etc)
*/
function format_time(time, format) {
    if (!format)
        format = 'medium';
    if (!time) {
        timenow = new Date();
        time = new Time(timenow.getHours(), timenow.getMinutes(), timenow.getSeconds());
    } else if (time instanceof Date) {
        time = new DateTime(time);
    }
    if (['full','long','medium','short'].indexOf(format)!==-1)
        format = get_time_format(format);
    var pattern = parse_datetime_pattern(format);
    return pattern.apply(time, _i18n_locale);
}

/**
* Like format_datetime, but converts the seconds to seconds+microseconds as ss.QQQ
* Also lets you specify the format to use for date and time individually
*
* For sub-second resolution, dt must be a DateTime object
*/
function format_datetime_microseconds(dt, date_base_format, time_base_format) {
    if (!date_base_format)
        date_base_format = 'short';
    if (!time_base_format)
        time_base_format = 'medium';
    if (!dt) {
        var timenow = new Date();
        dt = new Time(timenow.getHours(), timenow.getMinutes(), timenow.getSeconds());
    } else if (dt instanceof Date) {
        dt = new DateTime(dt);
    }

    var locale = _i18n_locale;
    var time_format = locale.time_formats[time_base_format + '-microsecond'];
    if (!time_format) {
        time_format = get_time_format(time_base_format);
        time_format = (time_format instanceof DateTimePattern) ? time_format.pattern  : time_format;
        time_format = time_format.replace(/ss/, 'ss_TTT', 'g'); // seconds.microseconds
        time_format = locale.time_formats[time_base_format + '-microsecond'] = parse_datetime_pattern(time_format);
    }

    return get_datetime_format(time_base_format).replace('{0}', format_time(dt, time_format)).replace('{1}', format_date(dt, date_base_format));
}

/**
* Like format_time, but converts the seconds to seconds+microseconds as ss.QQQ
* Also lets you specify the format to use for date and time individually
*
* For sub-second resolution, dt must be a DateTime or Time object
*/
function format_time_microseconds(time, time_base_format) {
    if (!time_base_format)
        time_base_format = 'medium';

    if (!time) {
        timenow = new Date();
        time = new Time(timenow.getHours(), timenow.getMinutes(), timenow.getSeconds());
    } else if (time instanceof Date) {
        time = new DateTime(time);
    }

    var locale = _i18n_locale;
    var time_format = locale.time_formats[time_base_format + '-microsecond'];
    if (!time_format) {
        time_format = get_time_format(time_base_format);
        time_format = (time_format instanceof DateTimePattern) ? time_format.pattern  : time_format;
        time_format = time_format.replace(/ss/, 'ss_TTT', 'g'); // seconds.microseconds
        time_format = locale.time_formats[time_base_format + '-microsecond'] = parse_datetime_pattern(time_format);
    }

    return format_time(time, time_format);
}

function locale_name() {
    return _i18n_locale.locale_name;
}

/**
* Returns true if the current locale displays times using the 12h clock
*/
function locale_uses_12h() {
     var time_format = get_time_format('medium');
     return time_format.format.indexOf('%(a)')!=-1;
}
function locale_uses_day_before_month() {
    var time_format = get_date_format("short"),
        formatStr = time_format.format.toLowerCase();
    if (formatStr.indexOf('%(d)')>-1 && formatStr.indexOf('%(m)')>-1) {
        return (formatStr.indexOf('%(d)') < formatStr.indexOf('%(m)'));
    }
    return false;
}

/**
* Class to hold time information in lieu of datetime.time
*/
function Time(hour, minute, second, microsecond) {
    if (_i18n_locale.locale_name == 'en_DEBUG') {
        this.hour = 11;
        this.minute = 22;
        this.second = 33;
        this.microsecond = 123000;
    } else {
        this.hour = hour;
        this.minute = minute;
        this.second = second;
        this.microsecond = microsecond ? microsecond : 0;
    }
}

/**
* Wrapper object for JS Date objects
*/
function DateTime(date) {
    if (date instanceof DateTime)
        return date;
    if (_i18n_locale.locale_name == 'en_DEBUG')
        date = new Date(3333, 10, 22, 11, 22, 33, 123);
    if (date instanceof Date) {
        this.date = date;
        this.hour = date.getHours();
        this.minute = date.getMinutes();
        this.second = date.getSeconds();
        this.microsecond = date.getMilliseconds() * 1000;
        this.year = date.getFullYear();
        this.month = date.getMonth()+1;
        this.day = date.getDate();
    } else {
        for(var k in date) {
            this[k] = date[k];
        }
    }
}

DateTime.prototype.weekday = function() {
    // python DateTime compatible function
    var d = this.date.getDay()-1;
    if (d<0) d=6;
    return d;
};


// No user serviceable parts below
// See your prefecture's Mr Sparkle representative for quality servicing

// This is mostly directly ported from Babel

function parse_number_pattern(pattern) {
    // Parse number format patterns
    var PREFIX_END = '[^0-9@#.,]';
    var NUMBER_TOKEN = '[0-9@#.,E+\-]';

    var PREFIX_PATTERN = "((?:'[^']*'|"+PREFIX_END+")*)";
    var NUMBER_PATTERN = "("+NUMBER_TOKEN+"+)";
    var SUFFIX_PATTERN = "(.*)";

    var number_re = new RegExp(PREFIX_PATTERN + NUMBER_PATTERN + SUFFIX_PATTERN);
    if (pattern instanceof NumberPattern) {
        return pattern;
    }

    var neg_pattern, pos_suffix, pos_prefix, neg_prefix, neg_suffix, num, exp, dum, sp;
    // Do we have a negative subpattern?
    if (pattern.indexOf(';')!==-1) {
        sp = pattern.split(';', 2);
        pattern=sp[0]; neg_pattern=sp[1];

        sp = pattern.match(number_re).slice(1);
        pos_prefix=sp[0]; num=sp[1]; pos_suffix=sp[2];

        sp = neg_pattern.match(number_re).slice(1);
        neg_prefix=sp[0]; neg_suffix=[2];
    } else {
        sp = pattern.match(number_re).slice(1);
        pos_prefix=sp[0]; num=sp[1]; pos_suffix=sp[2];
        neg_prefix = '-' + pos_prefix;
        neg_suffix = pos_suffix;
    }
    if (num.indexOf('E')!==-1) {
        sp = num.split('E', 2);
        num = sp[0]; exp=sp[1];
    } else {
        exp = null;
    }
    if (num.indexOf('@')!==-1) {
        if (num.indexOf('.')!==-1 && num.indexOf('0')!==-1)
            return alert('Significant digit patterns can not contain "@" or "0"');
    }
    var integer, fraction;
    if (num.indexOf('.')!==-1)  {
        sp = num.rsplit('.', 2);
        integer=sp[0]; fraction=sp[1];
    } else {
        integer = num;
        fraction = '';
    }
    var min_frac = 0, max_frac = 0 ;

    function parse_precision(p) {
        // Calculate the min and max allowed digits
        var min = 0; var max = 0;
        for(var i=0; i<p.length; i++) {
            var c = p.substr(i, 1);
            if ('@0'.indexOf(c)!==-1) {
                min += 1;
                max += 1;
            } else if (c == '#') {
                max += 1;
            } else if (c == ',') {
                continue;
            } else {
                break;
            }
        }
        return [min, max];
    }

    function parse_grouping(p) {
        /*
        Parse primary and secondary digit grouping

        >>> parse_grouping('##')
        0, 0
        >>> parse_grouping('#,###')
        3, 3
        >>> parse_grouping('#,####,###')
        3, 4
        */
        var width = p.length;
        var g1 = p.lastIndexOf(',');
        if (g1 == -1)
            return [1000, 1000];
        g1 = width - g1 - 1;
        // var g2 = p[:-g1 - 1].lastIndexOf(',')
        var g2 = p.substr(0, p.length-g1-1).lastIndexOf(',');
        if (g2 == -1)
            return [g1, g1];
        g2 = width - g1 - g2 - 2 ;
        return [g1, g2];
    }

    var int_prec = parse_precision(integer);
    var frac_prec = parse_precision(fraction);
    var exp_plus;
    var exp_prec;
    if (exp) {
        frac_prec = parse_precision(integer+fraction);
        exp_plus = exp.substr(0, 1) == '+';
        exp = exp.replace(/^\++/, '');
        exp_prec = parse_precision(exp);
    } else {
        exp_plus = null;
        exp_prec = null;
    }
    var grouping = parse_grouping(integer);
    return new NumberPattern(pattern, [pos_prefix, neg_prefix],
                         [pos_suffix, neg_suffix], grouping,
                         int_prec, frac_prec,
                         exp_prec, exp_plus);
}

// Don't instantiate this class directly; use the format_number() function
function NumberPattern(pattern, prefix, suffix, grouping, int_prec, frac_prec, exp_prec, exp_plus) {
    this.pattern = pattern;
    this.prefix = prefix;
    this.suffix = suffix;
    this.grouping = grouping;
    this.int_prec = int_prec;
    this.frac_prec = frac_prec;
    this.exp_prec = exp_prec;
    this.exp_plus = exp_plus;
    if ((this.prefix+this.suffix).indexOf('%')!==-1)
        this.scale = 100;
    else if ((this.prefix+this.suffix).indexOf('\u2030')!==-1)
        this.scale = 1000;
    else
        this.scale = 1;
}

(function() {

     split_number = function(value) {
        // Convert a number into a (intasstring, fractionasstring) tuple
        var a, b, sp;
        value = ''+value;
        if (value.indexOf('.')!==-1) {
            sp = (''+value).split('.');
            a=sp[0]; b=sp[1];
            if (b == '0')
                b = '';
        } else {
            a = value;
            b = '';
        }
        return [a, b];
    };


    bankersround = function(value, ndigits) {
        var a, b;
        if (!ndigits)
            ndigits = 0;
        var sign = value < 0 ? -1 : 1;
        value = Math.abs(value);
        var sp = split_number(value);
        a=sp[0]; b=sp[1];
        var digits = a + b;
        var add = 0;
        var i = a.length + ndigits;
        if (i < 0 || i >= digits.length) {
            // pass
            add = 0;
        } else if (digits.substr(i, 1) > '5') {
            add = 1;
        } else if (digits.substr(i, 1) == '5' && '13579'.indexOf(digits[i-1])!==-1) {
            add = 1;
        }
        var scale = Math.pow(10, ndigits);
        return parseInt(value * scale + add, 10) / scale * sign;
    };


    NumberPattern.prototype.apply = function(value, locale) {
        if (!locale)
            locale = _i18n_locale;
        value *= this.scale;
        var is_negative = value < 0 ? 1 : 0;
        if (this.exp_prec) { // Scientific notation
            value = Math.abs(value);
            var exp;
            if (value)
                exp = Math.floor(Math.log(value) / Math.log(10));
            else
                exp = 0;

            // Minimum number of integer digits
            if (this.int_prec[0] == this.int_prec[1])
                exp -= this.int_prec[0] - 1;
            // Exponent grouping
            else if (this.int_prec[1])
                exp = parseInt(exp, 10) / this.int_prec[1] * this.int_prec[1];

            if (exp < 0)
                value = value * Math.pow(10, -exp);
            else
                value = value / Math.pow(10, exp);

            var exp_sign = '';
            if (exp < 0)
                exp_sign = locale.minus_sign;
            else if (this.exp_plus)
                exp_sign = locale.plus_sign;
            exp = Math.abs(exp);
            var num = ''+
                 this._format_sigdig(value, this.frac_prec[0], this.frac_prec[1]) + locale.exp_symbol + exp_sign + this._format_int(''+exp, this.exp_prec[0], this.exp_prec[1], locale);
        } else if(this.pattern.indexOf('@')!==-1) { //  Is it a siginificant digits pattern?
            var text = this._format_sigdig(Math.abs(value), this.int_prec[0], this.int_prec[1]);
            if (text.indexOf('.')!==-1) {
                var a, b;
                var sp = text.split('.');
                a=sp[0]; b=sp[1];
                a = this._format_int(a, 0, 1000, locale);
                if (b)
                    b = locale.decimal_symbol + b;
                num = a + b;
            } else {
                num = this._format_int(text, 0, 1000, locale);
            }
        } else { // A normal number pattern
            var c, d;
            var cd_sp = split_number(bankersround(Math.abs(value), this.frac_prec[1]));
            c=cd_sp[0]; d=cd_sp[1];
            d = d || '0';
            c = this._format_int(c, this.int_prec[0], this.int_prec[1], locale);
            d = this._format_frac(d, locale);
            num = c + d;
        }
        var retval = '' + this.prefix[is_negative] + num + this.suffix[is_negative];
        return retval;
    };

    NumberPattern.prototype._format_sigdig = function(value, min, max) {
        var a, b;
        var sp = split_number(value);
        a=sp[0]; b=sp[1];
        var ndecimals = a.length;
        if (a=='0' && b!='') {
            ndecimals = 0;
            while(b[0] == '0') {
                b = b.substr(1);
                ndecimals -= 1;
            }
        }
        sp = split_number(bankersround(value, max - ndecimals));
        a=sp[0]; b=sp[1];
        var digits = ((a+b).replace(/^0+/, '')).length;
        if (!digits)
            digits = 1;
        // Figure out if we need to add any trailing '0':s
        if (a.length >= max && a!= '0')
            return a;
        if (digits < min)
            b += ('0'.repeat(min - digits));
        if (b)
            return a+'.'+b;
        return a;
    };

    NumberPattern.prototype._format_int = function(value, min, max, locale) {
        var width = value.length;
        if (width < min)
            value = '0'.repeat(min - width) + value;
        var gsize = this.grouping[0];
        var ret = '';
        var symbol = locale.group_symbol;
        while (value.length > gsize) {
            ret = symbol + value.substr(value.length - gsize) + ret;
            value = value.substr(0, value.length - gsize);
            gsize = this.grouping[1];
        }
        return value + ret;
    };

    NumberPattern.prototype._format_frac = function(value, locale) {
        var min = this.frac_prec[0];
        var max = this.frac_prec[1];
        if (value.length < min)
            value += '0'.repeat(min - value.length);
        if (max == 0 || (min == 0 && parseInt(value, 10) == 0))
            return '';
        var width = value.length;
        while (value.length > min && value.substr(value.length-1) == '0')
            value = value.substr(0, value.length-1);
        return locale.decimal_symbol + value;
    };

})();



// Date / time routines

function get_period_names(locale) {
    if (!locale)
        locale = _i18n_locale;
    return locale.periods;
}

function get_day_names(width, context, locale) {
    if (!width)
        width = 'wide';
    if (!context)
        context = 'format';
    if (!locale)
        locale = _i18n_locale;
    return locale.days[context][width];
}


function get_month_names(width, context, locale) {
    if (!width)
        width = 'wide';
    if (!context)
        context = 'format';
    if (!locale)
        locale = _i18n_locale;
    return locale.months[context][width];
}


function get_quarter_names(width, context, locale) {
    if (!width)
        width = 'wide';
    if (!context)
        context = 'format';
    if (!locale)
        locale = _i18n_locale;
    return locale.quarters[context][width];
}

function get_erar_names(width, locale) {
    if (!width)
        width = 'wide';
    if (!locale)
        locale = _i18n_locale;
    return locale.eras[width];
}

function get_date_format(format, locale) {
    if (!format)
        format = 'medium';
    if (!locale)
        locale = _i18n_locale;
    var dtp = locale.date_formats[format];
    return new DateTimePattern(dtp.pattern, dtp.format);
}

function get_datetime_format(format, locale) {
    if (!format)
        format = 'medium';
    if (!locale)
        locale = _i18n_locale;
    if (locale.datetime_formats[format] == undefined)
        return locale.datetime_formats[null];
    return locale.datetime_formats[format];
}

function get_time_format(format, locale) {
    if (!format)
        format = 'medium';
    if (!locale)
        locale = _i18n_locale;
    var dtp = locale.time_formats[format];
    return new DateTimePattern(dtp.pattern, dtp.format);
}

var PATTERN_CHARS = {
    'G': [1, 2, 3, 4, 5],                                           // era
    'y': null, 'Y': null, 'u': null,                                // year
    'Q': [1, 2, 3, 4], 'q': [1, 2, 3, 4],                           // quarter
    'M': [1, 2, 3, 4, 5], 'L': [1, 2, 3, 4, 5],                     // month
    'w': [1, 2], 'W': [1],                                          // week
    'd': [1, 2], 'D': [1, 2, 3], 'F': [1], 'g': null,               // day
    'E': [1, 2, 3, 4, 5], 'e': [1, 2, 3, 4, 5], 'c': [1, 3, 4, 5],  // week day
    'a': [1],                                                       // period
    'h': [1, 2], 'H': [1, 2], 'K': [1, 2], 'k': [1, 2],             // hour
    'm': [1, 2],                                                    // minute
    's': [1, 2], 'S': null, 'A': null,                              // second
    'T': null,                                                      // decimal microseconds
    'z': [1, 2, 3, 4], 'Z': [1, 2, 3, 4], 'v': [1, 4], 'V': [1, 4],  // zone
    '_': [1]                                                        // locale decimal symbol
};

function parse_datetime_pattern(pattern) {
    /*
    Parse date, time, and datetime format patterns.

    >>> parse_pattern("MMMMd").format
    u'%(MMMM)s%(d)s'
    >>> parse_pattern("MMM d, yyyy").format
    u'%(MMM)s %(d)s, %(yyyy)s'

    Pattern can contain literal strings in single quotes:

    >>> parse_pattern("H:mm' Uhr 'z").format
    u'%(H)s:%(mm)s Uhr %(z)s'

    An actual single quote can be used by using two adjacent single quote
    characters:

    >>> parse_pattern("hh' o''clock'").format
    u"%(hh)s o'clock"

    :param pattern: the formatting pattern to parse
    */
    if (pattern instanceof DateTimePattern)
        return pattern;

    var result = [];
    var quotebuf = null;
    var charbuf = [];
    var fieldchar = [''];
    var fieldnum = [0];

    function append_chars() {
        result.push(charbuf.join('').replace('%', '%%'));
        charbuf = [];
    }

    function append_field() {
        var limit = PATTERN_CHARS[fieldchar[0]];
        if (limit && limit.indexOf(fieldnum[0])==-1) {
            return alert('Invalid length for field: '+fieldchar[0].repeat(fieldnum[0]));
        }
        result.push('%('+(fieldchar[0].repeat(fieldnum[0]))+')s');
        fieldchar[0] = '';
        fieldnum[0] = 0;
    }

    //for idx, char in enumerate(pattern.replace("''", '\0')):
    var patterntmp = pattern.replace("''", '\0');
    for(var idx=0; idx<patterntmp.length; idx++) {
        var ch = patterntmp.substr(idx, 1);
        if (quotebuf === null) {
            if (ch == "'") { // # quote started
                if (fieldchar[0]) {
                    append_field();
                } else if (charbuf) {
                    append_chars();
                }
                quotebuf = [];
            } else if (ch in PATTERN_CHARS) {
                if (charbuf) {
                    append_chars();
                }
                if (ch == fieldchar[0]) {
                    fieldnum[0] += 1;
                } else {
                    if (fieldchar[0]) {
                        append_field();
                    }
                    fieldchar[0] = ch;
                    fieldnum[0] = 1;
                }
            } else {
                if (fieldchar[0]) {
                    append_field();
                }
                charbuf.push(ch);
            }

        } else if (quotebuf!=null) {
            if (ch == "'") { // end of quote
                charbuf.extend(quotebuf);
                quotebuf = null;
            } else { // # inside quote
                quotebuf.push(ch);
            }
        }
    }
    if (fieldchar[0]) {
        append_field();
    } else if (charbuf) {
        append_chars();
    }

    return new DateTimePattern(pattern, result.join('').replace('\0', "'"));
}

function DateTimePattern(pattern, format) {
    this.pattern = pattern;
    this.format = format;
}

DateTimePattern.prototype.apply = function(datetime, locale) {
    return sprintf(this.format, new DateTimeFormat(datetime, locale));
};

function DateTimeFormat(value, locale) {
    this.value = value;
    this.locale = locale;
}

DateTimeFormat.prototype.__getitem__ = function(name) {
    var ch = name.substr(0, 1);
    var num = name.length;
    switch(ch) {
        case 'G':
            return this.format_era(ch, num);
        case 'y':
        case 'Y':
        case 'u':
            return this.format_year(ch, num);
        case 'q':
        case 'Q':
            return this.format_quarter(ch, num);
        case 'M':
        case 'L':
            return this.format_month(ch, num);
        case 'w':
        case 'W':
            return this.format_week(ch, num);
        case 'd':
            return this.format(this.value.day, num);
        case 'D':
            return this.format_day_of_year(num);
        case 'F':
            return this.format_day_of_week_in_month();
        case 'E':
        case 'e':
        case 'c':
            return this.format_weekday(ch, num);
        case 'a':
            return this.format_period(ch);
        case 'h':
            if (this.value.hour % 12 == 0)
                return this.format(12, num);
            return this.format(this.value.hour % 12, num);
        case 'H':
            return this.format(this.value.hour, num);
        case 'K':
            return this.format(this.value.hour % 12, num);
        case 'k':
            if (this.value.hour == 0)
                return this.format(24, num);
            return this.format(this.value.hour, num);
        case 'm':
            return this.format(this.value.minute, num);
        case 's':
            return this.format(this.value.second, num);
        case 'S':
            return this.format_frac_seconds(num);
        case 'T':
            return this.format_decimal_frac_seconds(num);
        case 'A':
            return this.format_milliseconds_in_day(num);
        case 'z':
        case 'Z':
        case 'v':
        case 'V':
            return this.format_timezone(ch, num);
        case '_':
            return this.locale.decimal_symbol;
        default:
            return alert('Unsupported date/time field '+ch);
    }
};

DateTimeFormat.prototype.format_era = function(ch, num) {
    var width = {3: 'abbreviated', 4: 'wide', 5: 'narrow'}[max(3, num)];
    var era = this.value.year >= 0 ? 1 : 0;
    return get_era_names(width, this.locale)[era];
};

DateTimeFormat.prototype.format_year = function(ch, num) {
    var value = this.value.year;
    if (ch == ch.toUpperCase()) {
        var week = this.get_week_number(this.get_day_of_year());
        if (week == 0)
            value -= 1;
    }
    var year = this.format(value, num);
    if (num == 2)
        year = year.substr(year.length-2);
    return year;
};

DateTimeFormat.prototype.format_quarter = function(ch, num) {
    var quarter = Math.floor( (this.value.month - 1) / 3 + 1 );
    if (num <= 2)
        return sprintf(sprintf('%%0%dd', num),  quarter);
    var width = {3: 'abbreviated', 4: 'wide', 5: 'narrow'}[num];
    var context = {'Q': 'format', 'q': 'stand-alone'}[ch];
    return get_quarter_names(width, context, this.locale)[quarter];
};

DateTimeFormat.prototype.format_month = function(ch, num) {
    if (num <= 2)
        return sprintf(sprintf('%%0%dd', num), this.value.month);
    var width = {3: 'abbreviated', 4: 'wide', 5: 'narrow'}[num];
    var context = {'M': 'format', 'L': 'stand-alone'}[ch];
    return get_month_names(width, context, this.locale)[this.value.month];
};

DateTimeFormat.prototype.format_week = function(ch, num) {
    if (ch == ch.toLowerCase()) { //  # week of year
        var day_of_year = this.get_day_of_year();
        var week = this.get_week_number(day_of_year);
        if (week == 0) {
            var date = this.value - timedelta(days=day_of_year);
            week = this.get_week_number(this.get_day_of_year(date), date.weekday());
        }
        return this.format(week, num);
    } else { // # week of month
        var mon_week = this.get_week_number(this.value.day);
        if (mon_week == 0) {
            var mon_date = this.value - timedelta(days=this.value.day);
            mon_week = this.get_week_number(mon_date.day, mon_date.weekday());
        }
        return mon_week;
    }
};

DateTimeFormat.prototype.format_weekday = function(ch, num) {
    if (num < 3) {
        if (ch == ch.toLowerCase()) {
            var value = 7 - this.locale.first_week_day + this.value.weekday();
            return this.format(value % 7 + 1, num);
        }
        num = 3;
    }
    var weekday = this.value.weekday();
    var width = {3: 'abbreviated', 4: 'wide', 5: 'narrow'}[num];
    var context = {3: 'format', 4: 'format', 5: 'stand-alone'}[num];
    return get_day_names(width, context, this.locale)[weekday];
};

DateTimeFormat.prototype.format_day_of_year = function(num) {
    return this.format(this.get_day_of_year(), num);
};

DateTimeFormat.prototype.format_day_of_week_in_month = function() {
    return ((this.value.day - 1) / 7 + 1);
};

DateTimeFormat.prototype.format_period = function(ch) {
    var period = {0: 'am', 1: 'pm'}[this.value.hour >= 12 ? 1 : 0];
    return get_period_names(this.locale)[period];
};

DateTimeFormat.prototype.format_frac_seconds = function(num) {
    var value = this.value.microsecond;
    return this.format(parseFloat('0.'+value) * Math.pow(10, num), num);
};

DateTimeFormat.prototype.format_decimal_frac_seconds = function(num) {
    return this.format(this.value.microsecond, 6).substr(0, num);
};

DateTimeFormat.prototype.format_milliseconds_in_day = function(num) {
    var msecs = Math.floor(this.value.microsecond / 1000) + this.value.second * 1000 + this.value.minute * 60000 + this.value.hour * 3600000;
    return this.format(msecs, num);
};

DateTimeFormat.prototype.format_timezone = function(ch, num) {
    return ''; // XXX
};

DateTimeFormat.prototype.format = function(value, length) {
    return sprintf(sprintf('%%0%dd', length), value);
};

DateTimeFormat.prototype.get_day_of_year = function(date) {
    if (date == undefined)
        date = this.value;
    var yearstart = new Date(date.year, 0, 1);
    return Math.ceil((date.date - yearstart) / 86400000)+1;
};

DateTimeFormat.prototype.get_week_number = function(day_of_period, day_of_week) {
    /*"Return the number of the week of a day within a period. This may be
    the week number in a year or the week number in a month.

    Usually this will return a value equal to or greater than 1, but if the
    first week of the period is so short that it actually counts as the last
    week of the previous period, this function will return 0.

    >>> format = DateTimeFormat(date(2006, 1, 8), Locale.parse('de_DE'))
    >>> format.get_week_number(6)
    1

    >>> format = DateTimeFormat(date(2006, 1, 8), Locale.parse('en_US'))
    >>> format.get_week_number(6)
    2

    :param day_of_period: the number of the day in the period (usually
                          either the day of month or the day of year)
    :param day_of_week: the week day; if ommitted, the week day of the
                        current date is assumed
    */
    if (day_of_week==undefined)
        day_of_week = this.value.weekday();
    var first_day = (day_of_week - this.locale.first_week_day - day_of_period + 1) % 7;
    if (first_day < 0)
        first_day += 7;
    var week_number = (day_of_period + first_day - 1) / 7;
    if (7 - first_day >= this.locale.min_week_days)
        week_number += 1;
    return week_number;
};






var _i18n_catalog = {};
var _i18n_plural = undefined;
function i18n_register(catalog) {
    _i18n_plural = catalog['plural'];
    for(var k in catalog['catalog']) {
        _i18n_catalog[k] = catalog['catalog'][k];
    }
}



function BaseTimeRangeFormatter() {
    this.DATE_METHODS  = [
        {name: "year",   getter : "getFullYear",     setter: "setFullYear", minValue: "1974"},
        {name: "month",  getter : "getMonth",        setter: "setMonth",    minValue: "0"},
        {name: "day",    getter : "getDate",         setter: "setDate",     minValue: "1"},
        {name: "hour",   getter : "getHours",        setter: "setHours",    minValue: "0"},
        {name: "minute", getter : "getMinutes",      setter: "setMinutes",  minValue: "0"},
        {name: "second", getter : "getSeconds",      setter: "setSeconds",  minValue: "0"},
        {name: "millisecond", getter : "getMilliseconds", setter: "setMilliseconds",  minValue: "0"}
    ];
    //this.logger = Splunk.Logger.getLogger("i18n.js");
}
/*
 * Given absolute args, returns an object literal with four keys:
 * rangeIsSingleUnitOf, rangeIsIntegerUnitsOf, valuesDifferAt, and valuesHighestNonMinimalAt,
 * which are all one of [false, "second", "minute", "hour", "day", "month", "year"]
 */
BaseTimeRangeFormatter.prototype.get_summary_data = function(absEarliest, absLatest) {

    // Step 1 --  find the highest level at which there is a difference.
    var differAtLevel = this.get_differing_level(absEarliest, absLatest);
    var valuesDifferAt = (differAtLevel < this.DATE_METHODS.length) ? this.DATE_METHODS[differAtLevel].name : false;
    var rangeIsSingleUnitOf = false;
    var rangeIsIntegerUnitsOf = false;

    if (differAtLevel >= this.DATE_METHODS.length) {
        //this.logger.error("get_differing_level returned an invalid response");
        return {
            "rangeIsSingleUnitOf"   : false,
            "rangeIsIntegerUnitsOf" : false,
            "valuesDifferAt"    : false,
            "valuesHighestNonMinimalAt": false
        };
    }

    var methodDict = this.DATE_METHODS[differAtLevel];
    var earliestCopy;

    // Step 2 -- find if the range is an exact integral number of any particular unit.
    // for example lets say that valuesDifferAt is 'hour'.
    var highestNonMinimalLevel = this.get_highest_non_minimal_level(absEarliest, absLatest);
    var valuesHighestNonMinimalAt = (highestNonMinimalLevel < this.DATE_METHODS.length) ? this.DATE_METHODS[highestNonMinimalLevel].name : false;
    if (highestNonMinimalLevel == differAtLevel) {
        rangeIsIntegerUnitsOf = valuesDifferAt;

    // Step 3 -- catch some tricky corner cases that we missed. of 'last day of month',  'last month of year'
    } else {
        var methodDictInner = this.DATE_METHODS[highestNonMinimalLevel];
        earliestCopy = new Date();
        earliestCopy.setTime(absEarliest.valueOf());

        earliestCopy[methodDictInner.setter](earliestCopy[methodDictInner.getter]() + 1);
        if (earliestCopy.getTime() == absLatest.getTime()) {
            rangeIsSingleUnitOf = rangeIsIntegerUnitsOf = this.DATE_METHODS[highestNonMinimalLevel].name;
        }
    }

    // Step 4 -- if we're an integer number, check if we're also a single unit of something.
    if (rangeIsIntegerUnitsOf && !rangeIsSingleUnitOf) {
        earliestCopy = new Date();
        earliestCopy.setTime(absEarliest.valueOf());

        // in our example this earliest one hour ahead.
        if (rangeIsIntegerUnitsOf=="hour") {
            // JS resolves the 2AM DST ambiguity in the fall, by picking the
            // later of the two 2AM's. This avoids the ambiguity for the one
            // problematic case.
            earliestCopy.setTime(earliestCopy.valueOf() + 3600000);
        } else {
            earliestCopy[methodDict.setter](earliestCopy[methodDict.getter]() + 1);
        }
        // if they are now the same time, it's a single unit.
        if (earliestCopy.getTime() == absLatest.getTime()) {
            rangeIsSingleUnitOf = this.DATE_METHODS[differAtLevel].name;
        }
    }

    return {
        "rangeIsSingleUnitOf"   : rangeIsSingleUnitOf,
        "rangeIsIntegerUnitsOf" : rangeIsIntegerUnitsOf,
        "valuesDifferAt"    : valuesDifferAt,
        "valuesHighestNonMinimalAt": valuesHighestNonMinimalAt
    };
};
BaseTimeRangeFormatter.prototype.get_highest_non_minimal_level = function(absEarliest, absLatest) {
    for (var i=this.DATE_METHODS.length-1; i>=0; i--) {
        var methodDict = this.DATE_METHODS[i];
        var name = methodDict.name;
        var minValue = methodDict.minValue;
        var earliestValue = absEarliest[methodDict["getter"]]();
        var latestValue   = absLatest[methodDict["getter"]]();

        if (earliestValue != minValue || latestValue != minValue) {
            return i;
        }
    }
};
BaseTimeRangeFormatter.prototype.get_differing_level= function(absEarliest, absLatest) {
    var differAtLevel = 0;
    for (var i=0; i<this.DATE_METHODS.length; i++) {
        var methodDict = this.DATE_METHODS[i];
        var name = methodDict.name;
        var earliestValue = absEarliest[methodDict["getter"]]();
        var latestValue   = absLatest[methodDict["getter"]]();
        if (earliestValue == latestValue) {
            differAtLevel = i+1;
        } else break;
    }
    return differAtLevel;
};
BaseTimeRangeFormatter.prototype.format_range = function(earliestTime, latestTime) {
    var argsDict;
    if (earliestTime && !latestTime) {
        argsDict = {
            startDateTime: format_datetime(earliestTime, 'medium')
        };
        return sprintf(_("since %(startDateTime)s"), argsDict);
    }

    if (!earliestTime && latestTime) {
        argsDict = {
            endDateTime: format_datetime(latestTime, 'medium')
        };
        return sprintf(_("before %(endDateTime)s"), argsDict);
    }

    // there's some low hanging fruit for some simple localizable optimizations
    // pull out the 3 salient facts about the time range
    var summary = this.get_summary_data(earliestTime,latestTime);
    switch (summary["rangeIsSingleUnitOf"]) {
        case "day" :
            return format_date(earliestTime, "medium");
        case "second" :
            return format_datetime(earliestTime, "medium");
        default:
            break;
    }
    // if format_date(earliestTime)  and format_date(latestTime) are identical
    // then only display the date once, and then show the difference with just format_time
    var argDict;
    if (format_date(earliestTime, "medium")  == format_date(latestTime, "medium")) {
        argDict = {
            date : format_date(earliestTime, "medium"),
            start             : format_time(earliestTime, 'medium'),
            end               : format_time(latestTime,   'medium')
        };
        // TRANS: in this particular case the date is the same for both start and end.
        return sprintf(_("%(date)s from %(start)s to %(end)s"), argDict);
    }

    argDict = {
        start : format_datetime(earliestTime, 'medium'),
        end   : format_datetime(latestTime,   'medium')
    };
    return sprintf(_("from %(start)s to %(end)s"), argDict);
};

function EnglishRangeFormatter(use24HourClock, useEuropeanDateAndMonth, abbreviateDayAndMonth) {
    this.use24HourClock = use24HourClock || false;
    this.useEuropeanDateAndMonth = useEuropeanDateAndMonth || false;
    this.abbreviateDayAndMonth = abbreviateDayAndMonth || false;
}
EnglishRangeFormatter.prototype = new BaseTimeRangeFormatter();
EnglishRangeFormatter.prototype.constructor = EnglishRangeFormatter;
EnglishRangeFormatter.superClass  = BaseTimeRangeFormatter.prototype;

/*
 * Given a summary dictionary ( see get_summary_data() above ),
 * this method will return a dictionary with two keys "earliest" and "latest"
 * both of whose values are time format strings.
 * THIS IS FOR USE ONLY IN english locales,
 * NOTICE NO STRINGS ARE LOCALIZED.  THIS IS DELIBERATE
 *
 */
EnglishRangeFormatter.prototype.get_format_strings= function(summary) {
    switch (summary["rangeIsSingleUnitOf"]) {
        case "year" :
            return {"earliest" : "during %Y"};
        case "month" :
            return {"earliest" : "during %B %Y"};
        case "day" :
            return {"earliest" : "during %A, %B %e, %Y"};
        case "hour" :
            return {"earliest" : "at %l %p on %A, %B %e, %Y"};
        case "minute" :
            return {"earliest" : "at %l:%M %p %A, %B %e, %Y"};
        case "second" :
            return {"earliest" : "at %l:%M:%S %p on %A, %B %e, %Y"};
        case "millisecond" :
            return {"earliest" : "at %l:%M:%S.%Q %p on %A, %B %e, %Y"};
        default :
            /*  step 2 harder weirder corner cases where the range satisfies both
              a)  it is an integer number of X where x is months | days | hours | minutes | seconds
              b)  the range does not span a boundary of X's parent Y.
            */
            switch (summary["rangeIsIntegerUnitsOf"]) {
                case "year" :
                    return {
                        "earliest" : "from %Y",
                        "latest"   : " through %Y"
                    };
                case "month" :
                    return {
                        "earliest" : "from %B",
                        "latest"   : " through %B, %Y"
                    };
                case "day" :
                    return {
                        "earliest" : "from %B %e",
                        "latest"   : " through %B %e, %Y"
                    };
                case "hour" :
                    return {
                        "earliest" : "from %l %p",
                        "latest"   : " to %l %p on %A, %B %e, %Y"
                    };
                case "minute" :
                    return {
                        "earliest" : "from %l:%M %p",
                        "latest"   : " to %l:%M %p on %A, %B %e, %Y"
                    };
                case "second" :
                    return {
                        "earliest" : "from %l:%M:%S %p",
                        "latest"   : " to %l:%M:%S %p on %A, %B %e, %Y"
                    };
                case "millisecond" :
                    return {
                        "earliest" : "from %l:%M:%S.%Q %p",
                        "latest"   : " to %l:%M:%S.%Q %p on %A, %B %e, %Y"
                    };
                default :
                    var timeFormat = "";
                    switch (summary["valuesHighestNonMinimalAt"]) {
                        case "hour" :
                            timeFormat = " %l %p";
                            break;
                        case "minute" :
                            timeFormat = " %l:%M %p";
                            break;
                        case "second" :
                            timeFormat = " %l:%M:%S %p";
                            break;
                        case "millisecond" :
                            timeFormat = " %l:%M:%S.%Q %p";
                            break;
                        default:
                            break;
                    }
                    var rangeFormat = timeFormat ? " to" : " through";
                    switch (summary["valuesDifferAt"]) {
                        case "millisecond" :
                        case "second" :
                        case "minute" :
                        case "hour" :
                            return {
                                "earliest" : "from" + timeFormat,
                                "latest"   : rangeFormat + timeFormat + " on %A, %B %e, %Y"
                            };
                        case "day" :
                        case "month" :
                            return {
                                "earliest" : "from" + timeFormat + " %B %e",
                                "latest"   : rangeFormat + timeFormat + " %B %e, %Y"
                            };
                        default :
                            return {
                                "earliest" : "from" + timeFormat + " %B %e, %Y",
                                "latest"   : rangeFormat + timeFormat + " %B %e, %Y"
                            };
                    }
            }
    }
    //this.logger.error("Assertion failed - get_format_strings should have returned in all cases. rangeIsSingleUnitOf=", summary["rangeIsSingleUnitOf"], " rangeIsIntegerUnitsOf=", summary["rangeIsIntegerUnitsOf"]  , " valuesDifferAt=", summary["valuesDifferAt"]);
};
/**
 * This implementation would not scale well beyond these two little configs,
 * NOTE THE ASSUMPTIONS INLINE.  Possibly should be replaced with actual assertions
 * but that's a lot of regex to add.
 */
EnglishRangeFormatter.prototype.applyCustomOptions = function(timeFormatStr) {
    if (this.use24HourClock) {
        // ASSUMPTION 1 - where %p appears in the class' internal literals and has
        //                no :%S value right before it,
        //                there is always a single space, ie %H %p;
        timeFormatStr = timeFormatStr.replace(/%l %p/g, "%H:00");
        // now that we've rescued relevant ones and replaced with %H:00
        // ASSUMPTION 2 - where %p in the classes internal formatstrings it
        //                is always preceded by a space .
        timeFormatStr = timeFormatStr.replace(/ %p/g, "");
        // And now we safely replace all the instances of 12-hour hours with 24-hour hours.
        timeFormatStr = timeFormatStr.replace(/%l/g, "%H");
    }
    if (this.useEuropeanDateAndMonth) {
        // ASSUMPTION 3 - where day and month appear in the classes internal formatstrings
        //                they are ALWAYS %B and %e and there is exactly one space in between.
        timeFormatStr = timeFormatStr.replace(/%B %e/g, "%e %B");
    }
    if (this.abbreviateDayAndMonth) {
        timeFormatStr = timeFormatStr.replace('%A', "%a");
        timeFormatStr = timeFormatStr.replace('%B', "%b");
    }
    return timeFormatStr;
};
EnglishRangeFormatter.prototype.format_range = function(earliestTime, latestTime) {
    // if only earliestTime is defined
    if (earliestTime && !latestTime) {
        return earliestTime.strftime(this.applyCustomOptions("since %l:%M:%S %p %B %e, %Y"));
    }
    // if only latestTime is defined.
    else if (!earliestTime && latestTime) {
        return latestTime.strftime(this.applyCustomOptions("before %l:%M:%S %p %B %e, %Y"));
    }
    // ASSUME BOTH ARE DEFINED
    if (!earliestTime || !latestTime) throw("Assertion failed. format_range expected defined values for both earliest and latest, but one or more was undefined.");

    // pull out the 3 salient facts about the time range
    var summary = this.get_summary_data(earliestTime,latestTime);

    // we pass those salient facts into a function that gives us back
    // a dictionary with either two format strings, 'earliest' and 'latest',
    // or in the case of certain simple searches, just 'earliest'
    var formatStrings = this.get_format_strings(summary);

    // we cheat a bit here.  For year, month, day, we subtract a day so we can say
    // the more definitive "through 2005" instead of the kinda-confusing "to 2006"
    if (summary["valuesHighestNonMinimalAt"] && (summary["valuesHighestNonMinimalAt"] == "year" ||
        summary["valuesHighestNonMinimalAt"] == "month" || summary["valuesHighestNonMinimalAt"] == "day")) {
        latestTime = new Date(latestTime.getTime());
        latestTime.setDate(latestTime.getDate() - 1);
    }
    if (formatStrings["latest"]) {
        return earliestTime.strftime(this.applyCustomOptions(formatStrings["earliest"])) + latestTime.strftime(this.applyCustomOptions(formatStrings["latest"]));
    }
    return earliestTime.strftime(this.applyCustomOptions(formatStrings["earliest"]));
};
/**
 * delegates internally to the format_range method of the appropriate instance of
 * BaseTimeRangeFormatter.
 * Through this mechanism, if you want to localize your time formatting but you find
 * that BaseTimeRangeFormatter can be a bit heavy-handed, you can write your own
 * Formatter class, and you have the option of extending BaseTimeRangeFormatter
 * to get the summary logic there, but you dont have to if you dont want to.
 */
function format_datetime_range(locale, earliestTime, latestTime, abbreviateDayAndMonth) {
    locale = locale || locale_name().replace('_', '-');
    //locale = "en-AR";
    var f = null;
    var use24HourClock = !locale_uses_12h();
    var useEuropeanDateAndMonth = locale_uses_day_before_month();
    if (Splunk.util.trim(locale).indexOf("en-") == 0) {
        f = new EnglishRangeFormatter(use24HourClock, useEuropeanDateAndMonth, abbreviateDayAndMonth);
    } else {
        f = new BaseTimeRangeFormatter();
    }
    return f.format_range(earliestTime, latestTime);
}


function epochToDateTime(time, timeZoneOffset) {
    var date = new Date(Math.floor((time + timeZoneOffset) * 1000));
    var dateTime = new DateTime({
        date: date,
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        second: date.getUTCSeconds(),
        microsecond: date.getUTCMilliseconds() * 1000
    });
    dateTime.weekday = function() {
        var d = this.date.getUTCDay() - 1;
        if (d < 0)
            d = 6;
        return d;
    };
    return dateTime;
}

