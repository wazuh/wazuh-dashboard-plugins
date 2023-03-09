/**
 * TODO: This file is copied for short term because we couldn’t use it together
 * with dashboards due to swc-mc bringing in duplicate dependencies which
 * caused errors. Need to rmeove this after the issue is resolved.
 */
define(
    [
        "splunkjs/mvc/utils"
    ],
    function(utils) {

        return {
            getFullPath: function(path) {
                var root = utils.getPageInfo().root;
                var locale = utils.getPageInfo().locale;
                return (root ? '/'+root : '') + '/' + locale + path;
            }
        };
    }
);
