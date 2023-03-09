define(['splunk_monitoring_console/contrib/underscore', '@splunk/swc-mc'], function(_, SwcMC) {
    // use underscore's mixin functionality to add the ability to localize a string
    _.mixin({
        t: function(string) {
            return SwcMC.Splunki18n._(string);
        }
    });

    return _.noConflict();
});