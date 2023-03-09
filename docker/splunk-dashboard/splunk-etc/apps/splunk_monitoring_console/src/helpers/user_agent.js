define(['underscore'], function(_) {

    /*
     * Based on following browsers supported by Splunk and sample user agent strings:
     *
     * Chrome 26 - "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.65 Safari/537.31"
     * Firefox 21 - "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:21.0) Gecko/20100101 Firefox/21.0"
     * Safari 6 - "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8) AppleWebKit/536.25 (KHTML, like Gecko) Version/6.0 Safari/536.25"
     * IE 10 - "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)"
     * IE 9 - "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)"
     * IE 8 - "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)"
     * IE 7 - "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)"
     *
     * (not officially supported)
     *
     * Safari (iOS iPhone) - "Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25"
     * Safari (iOS iPad) - "Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25"
     */

    var TESTS = {
        Chrome: /chrome/i,
        Firefox: /firefox/i,
        Safari: /safari/i,
        //User-agent string has been changed for IE11
        //Here is the sample user-agent string: "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko"
        IE: /(?=.*msie ([\d.]+))|(?=.*trident)(?=.*rv\:([\d.]+))/i,
        IE11: /(?=.*trident)(?=.*rv\:11)/i,
        IE10: /msie 10\.0/i,
        IE9: /msie 9\.0/i,
        IE8: /msie 8\.0/i,
        IE7: /msie 7\.0/i,
        SafariiPhone: /iPhone/,
        SafariiPad: /iPad/
    };

    var IE_URL_LIMIT = 2048;

    var helper = {

        // put this here so it can be mocked in unit tests
        agentString: window.navigator.userAgent,

        // add methods for each of the test regexes
        isChrome: function() { return TESTS.Chrome.test(helper.agentString); },
        isFirefox: function() { return TESTS.Firefox.test(helper.agentString); },
        isIE: function() { return TESTS.IE.test(helper.agentString); },
        isIE11: function() { return TESTS.IE11.test(helper.agentString); },
        isIE10: function() { return TESTS.IE10.test(helper.agentString); },
        isIE9: function() { return TESTS.IE9.test(helper.agentString); },
        isIE8: function() { return TESTS.IE8.test(helper.agentString); },
        isIE7: function() { return TESTS.IE7.test(helper.agentString); },
        // Safari is a little more complicated
        isSafari: function() { return !helper.isChrome() && !helper.isSafariiPhone() && !helper.isSafariiPad() && TESTS.Safari.test(helper.agentString); },
        isSafariiPhone: function() { return TESTS.SafariiPhone.test(helper.agentString); },
        isSafariiPad: function() { return TESTS.SafariiPad.test(helper.agentString); },
        isiOS: function() { return helper.isSafariiPhone() || helper.isSafariiPad(); },

        isIELessThan: function(testVersion) {
            return helper.isIE() && parseFloat((TESTS.IE.exec(helper.agentString).sort(function(a, b) {return b - a;}))[0]) < testVersion;
        },

        isInIE7DocumentMode: function() {
            return document.documentMode == 7 ? true : false;
        },

        hasUrlLimit: function() {
            return helper.isIE() ? true : false;
        },
        getUrlLimit: function() {
            return helper.hasUrlLimit() ? IE_URL_LIMIT : Infinity;
        },

        getChromeVersion: function() {
            return parseFloat(helper.agentString.split(" Chrome/")[1]) || undefined;
        }

    };

    // memoize all of the things
    _(_.functions(helper)).chain().each(function(fnName) { helper[fnName] = _(helper[fnName]).memoize(); });

    return helper;

});
