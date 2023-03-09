i18n_register({
    plural: function(n) {
        return n == 1 ? 0 : 1;
    },
    catalog: {}
});

var _i18n_locale = {
    date_formats: {
        full: {
            pattern: "EEEE, MMMM d, y",
            format: "%(EEEE)s, %(MMMM)s %(d)s, %(y)s"
        },
        short: {
            pattern: "M/d/yy",
            format: "%(M)s/%(d)s/%(yy)s"
        },
        long: {
            pattern: "MMMM d, y",
            format: "%(MMMM)s %(d)s, %(y)s"
        },
        medium: {
            pattern: "MMM d, y",
            format: "%(MMM)s %(d)s, %(y)s"
        }
    },
    datetime_formats: {
        null: "{1} {0}"
    },
    days: {
        "stand-alone": {
            abbreviated: {
                "0": "Mon",
                "1": "Tue",
                "2": "Wed",
                "3": "Thu",
                "4": "Fri",
                "5": "Sat",
                "6": "Sun"
            },
            short: {
                "0": "Mo",
                "1": "Tu",
                "2": "We",
                "3": "Th",
                "4": "Fr",
                "5": "Sa",
                "6": "Su"
            },
            narrow: {
                "0": "M",
                "1": "T",
                "2": "W",
                "3": "T",
                "4": "F",
                "5": "S",
                "6": "S"
            },
            wide: {
                "0": "Monday",
                "1": "Tuesday",
                "2": "Wednesday",
                "3": "Thursday",
                "4": "Friday",
                "5": "Saturday",
                "6": "Sunday"
            }
        },
        format: {
            abbreviated: {
                "0": "Mon",
                "1": "Tue",
                "2": "Wed",
                "3": "Thu",
                "4": "Fri",
                "5": "Sat",
                "6": "Sun"
            },
            short: {
                "0": "Mo",
                "1": "Tu",
                "2": "We",
                "3": "Th",
                "4": "Fr",
                "5": "Sa",
                "6": "Su"
            },
            narrow: {
                "0": "M",
                "1": "T",
                "2": "W",
                "3": "T",
                "4": "F",
                "5": "S",
                "6": "S"
            },
            wide: {
                "0": "Monday",
                "1": "Tuesday",
                "2": "Wednesday",
                "3": "Thursday",
                "4": "Friday",
                "5": "Saturday",
                "6": "Sunday"
            }
        }
    },
    decimal_symbol: ".",
    eras: {
        abbreviated: {
            "0": "BC",
            "1": "AD"
        },
        narrow: {
            "0": "B",
            "1": "A"
        },
        wide: {
            "0": "Before Christ",
            "1": "Anno Domini"
        }
    },
    exp_symbol: "E",
    first_week_day: 6,
    group_symbol: ",",
    locale_name: "en_US",
    min_week_days: 1,
    minus_sign: "-",
    months: {
        "stand-alone": {
            abbreviated: {
                "1": "Jan",
                "2": "Feb",
                "3": "Mar",
                "4": "Apr",
                "5": "May",
                "6": "Jun",
                "7": "Jul",
                "8": "Aug",
                "9": "Sep",
                "10": "Oct",
                "11": "Nov",
                "12": "Dec"
            },
            narrow: {
                "1": "J",
                "2": "F",
                "3": "M",
                "4": "A",
                "5": "M",
                "6": "J",
                "7": "J",
                "8": "A",
                "9": "S",
                "10": "O",
                "11": "N",
                "12": "D"
            },
            wide: {
                "1": "January",
                "2": "February",
                "3": "March",
                "4": "April",
                "5": "May",
                "6": "June",
                "7": "July",
                "8": "August",
                "9": "September",
                "10": "October",
                "11": "November",
                "12": "December"
            }
        },
        format: {
            abbreviated: {
                "1": "Jan",
                "2": "Feb",
                "3": "Mar",
                "4": "Apr",
                "5": "May",
                "6": "Jun",
                "7": "Jul",
                "8": "Aug",
                "9": "Sep",
                "10": "Oct",
                "11": "Nov",
                "12": "Dec"
            },
            narrow: {
                "1": "J",
                "2": "F",
                "3": "M",
                "4": "A",
                "5": "M",
                "6": "J",
                "7": "J",
                "8": "A",
                "9": "S",
                "10": "O",
                "11": "N",
                "12": "D"
            },
            wide: {
                "1": "January",
                "2": "February",
                "3": "March",
                "4": "April",
                "5": "May",
                "6": "June",
                "7": "July",
                "8": "August",
                "9": "September",
                "10": "October",
                "11": "November",
                "12": "December"
            }
        }
    },
    number_format: "#,##0.###",
    percent_format: "#,##0%",
    periods: {
        pm: "PM",
        morning1: "morning",
        am: "AM",
        evening1: "evening",
        noon: "noon",
        midnight: "midnight",
        afternoon1: "afternoon",
        night1: "night"
    },
    plus_sign: "+",
    quarters: {
        "stand-alone": {
            abbreviated: {
                "1": "Q1",
                "2": "Q2",
                "3": "Q3",
                "4": "Q4"
            },
            narrow: {
                "1": "1",
                "2": "2",
                "3": "3",
                "4": "4"
            },
            wide: {
                "1": "1st quarter",
                "2": "2nd quarter",
                "3": "3rd quarter",
                "4": "4th quarter"
            }
        },
        format: {
            abbreviated: {
                "1": "Q1",
                "2": "Q2",
                "3": "Q3",
                "4": "Q4"
            },
            narrow: {
                "1": "1",
                "2": "2",
                "3": "3",
                "4": "4"
            },
            wide: {
                "1": "1st quarter",
                "2": "2nd quarter",
                "3": "3rd quarter",
                "4": "4th quarter"
            }
        }
    },
    scientific_format: "#E0",
    time_formats: {
        full: {
            pattern: "h:mm:ss a zzzz",
            format: "%(h)s:%(mm)s:%(ss)s %(a)s %(zzzz)s"
        },
        short: {
            pattern: "h:mm a",
            format: "%(h)s:%(mm)s %(a)s"
        },
        long: {
            pattern: "h:mm:ss a z",
            format: "%(h)s:%(mm)s:%(ss)s %(a)s %(z)s"
        },
        medium: {
            pattern: "h:mm:ss a",
            format: "%(h)s:%(mm)s:%(ss)s %(a)s"
        }
    }
};
