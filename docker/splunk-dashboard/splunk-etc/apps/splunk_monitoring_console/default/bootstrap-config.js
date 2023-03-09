define([], function() {


    return {
        hooks: {
            beforeSetup: function() {
                window.$C = {};
            },

            beforeEachAppLoad: function(app) {
            },

            afterEachAppLoad: function(app) {
            },

            beforeEachApp: function(app) {
            }
        },

        testHelpers: function() {
            return {
                mockModuleLocationsGen: function mockModules(list_of_module_locations, mock_location) {
                    //webpack transforms calls to this helper at define-time (for .js test files)
                    throw new Error('Calling mockModuleLocationsGen at runtime or from ES6 files is unsupported');
                }
            };
        },

        moduleIsolatorBlacklist: function() {
            return [
                // document.registerElement doesn't support multiple calls
                /webcomponents\/forminputs\/Splunk.*/
            ];
        }
    };
});
