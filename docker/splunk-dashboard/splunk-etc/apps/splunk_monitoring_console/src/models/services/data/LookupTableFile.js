define(
    [
        'underscore',
        '@splunk/swc-mc'
    ],
    function(
        _,
        SwcMC
    ) {
        var LookupTableFile = SwcMC.SplunkDBaseModel.extend({
            url: 'data/lookup-table-files',

            initialize: function() {
                SwcMC.SplunkDBaseModel.prototype.initialize.apply(this, arguments);
            },

            getDatasetDisplayType: function() {
                return LookupTableFile.DATASET_DISPLAY_TYPES.LOOKUP_TABLE;
            },

            getFromType: function() {
                return LookupTableFile.DATASET_FROM_TYPES.INPUTLOOKUP;
            },

            getFields: function() {
                // TODO: the backend at some point is going to provide us with fields from
                // lookup table files.

                return [];
            },

            getTypedFields: function() {
                return this.getFields();
            },

            // we have to return false here because we get no fields for table files
            // we are dependent on the AST to tell us the fields
            isFixedFields: function() {
                return false;
            },

            canPivot: function() {
                return true;
            },

            canSearch: function() {
                return true;
            },

            canTable: function() {
                return true;
            },

            canEditDescription: function() {
                return false;
            },

            canClone: function() {
                //TODO: determine how the cloning of lookup table files does not conform to other EAI endpoints and enable this
                return false;
            }

        }, {
            DATASET_FROM_TYPES: {
                INPUTLOOKUP: 'inputlookup'
            },
            DATASET_DISPLAY_TYPES: {
                LOOKUP_TABLE: _('lookup table file').t()
            }
        });

        return LookupTableFile;
    }
);
