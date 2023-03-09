/*
These tests need to live at this location so that they are processed for translation correctly
See testing/tests/i18n.html for the harness

Tests assume that the test runner is being executed in an en-US context
*/

function testTranslate() {
    assertEquals('test string translated', _('test string untranslated'));
    assertUndefined(_(undefined));
    assertEquals('', _(''));
}

function testNumTranslate() {
    assertEquals('test numeral one translated', ungettext('test numeral one untranslated', 'test numeral two untranslated', 1));
}

function testNumberFormat() {
   assertEquals('1,234.56', format_number(1234.56));
   assertEquals('1,234.556', format_number(1234.5555));
   assertEquals('1,234.556', format_number(1234.5565));
}
function testUnwantedDecimalRounding() {
    assertEquals('0.9',  format_number(0.9));
    assertEquals('0.001',  format_number(0.001));
    assertEquals('0.007',  format_number(0.007));
    assertEquals('0.99', format_number(0.99));
    // up to this point all is well but there's a weird bug that crept in (before jan 2010)
    // where 0.08, 0.09, 0.008 and 0.009 round up to 0.
    assertEquals('0.09',  format_number(0.09));
    assertEquals('0.009',  format_number(0.009));
}

function testPercentFormat() {
    assertEquals('155%', format_percent(1.55));
    assertEquals('1,234.568%', format_percent(12.345678));
}

function testScientificFormat() {
    assertEquals('3E6', format_scientific(3000000));
}

function monthToEnglishShortMonth(month) {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
}

function monthToEnglishLongMonth(month) {
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month];
}

function dayToEnglishName(day) {
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
}

function testDateFormat() {
    var t = new Date();
    // Default is 'medium' format string - "Nov 2, 2008"
    var expected = monthToEnglishShortMonth(t.getMonth())+' '+t.getDate()+', '+t.getFullYear();
    assertEquals(expected, format_date(t));
    assertEquals(expected, format_date(Math.floor(t.getTime()/1000))); /* test unix timestamps */

}

function testDateTimeFormat() {
    var t = new Date();
    var expected = dayToEnglishName(t.getDay())+', '+monthToEnglishLongMonth(t.getMonth())+' '+t.getDate()+', '+t.getFullYear();
    expected +=' '+(t.getHours()>12 ? t.getHours()-12 : (t.getHours() == 0? 12 : t.getHours()));
    expected +=':'+(t.getMinutes()<10 ? '0'+t.getMinutes() : t.getMinutes());
    expected +=':'+(t.getSeconds()<10 ? '0'+t.getSeconds() : t.getSeconds());
    expected +=' '+(t.getHours()>11 ? 'PM' : 'AM');
    assertEquals(expected, format_datetime(t, 'full').replace(/ +$/, ''));
}

function testDateTimeMicrosecondsFormatFromDateTime() {
    var dt = new DateTime({
        hour: 14,
        minute: 2,
        second: 3,
        microsecond: 44000,
        year: 2009,
        month: 6,
        day: 2
    });

    var expected = '6/2/09 2:02:03.044 PM';
    assertEquals(expected, format_datetime_microseconds(dt));
}

function testDateTimeMicrosecondsFormatFromDate() {
    var fooDate = new Date("2013-05-09T13:06:58.371-0700"),
        fooDateTime = new DateTime(fooDate),
        barDate = new Date("2012-01-20T04:45:01.000-0900"),
        barDateTime = new DateTime(barDate);
    assertEquals("microseconds field is zero", "1/20/12 5:45:01.000 AM", format_datetime_microseconds(barDateTime));
    assertEquals("non-zero microseconds field", "5/9/13 1:06:58.371 PM", format_datetime_microseconds(fooDateTime));
}

