define(
    [
        "@splunk/swc-mc"
    ],
    function(SwcMC) {

        return {
            getFullPath: function(path) {
                var root = SwcMC.Utils.getPageInfo().root;
                var locale = SwcMC.Utils.getPageInfo().locale;
                return (root ? '/'+root : '') + '/' + locale + path;
            }
        };
    }
);