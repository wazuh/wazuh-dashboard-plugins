define(
    [
        "models/services/data/LookupTableFile",
        "@splunk/swc-mc"
    ],
    function(
        LookupTableFileModel,
        SwcMC
    ) {
        return SwcMC.SplunkDsBaseCollection.extend({
            model: LookupTableFileModel,
            url: 'data/lookup-table-files',
            initialize: function() {
                SwcMC.SplunkDsBaseCollection.prototype.initialize.apply(this, arguments);
            }
        });
    }
);
