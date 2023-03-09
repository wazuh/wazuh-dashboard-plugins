define([
    'jquery',
    'underscore',
    'splunkjs/mvc',
    'splunkjs/mvc/utils',
    'splunkjs/mvc/sharedmodels',
    'collections/services/saved/Searches',
    'splunk_monitoring_console/views/settings/forwarder_setup/lite/dialogs/Master_old',
    'splunkjs/mvc/simplexml/ready!'
], function($, _, mvc, utils, SharedModels, SavedSearchesCollection, SetupModal) {

    var $setupButton = $('<a class="btn pull-right primary-btn" href="#" target="_blank"><i class="icon icon-gear"></i> Setup</a>');
    var savedSearchesCollection = new SavedSearchesCollection();
    var serverInfo = SharedModels.get('serverInfo');
    var application = SharedModels.get('app');
    $('.dashboard-header h2').before($setupButton);

    // helper function to fetch the collection and invoke the passed in success function
    var fetchSavedSearch = function(successFn) {
        savedSearchesCollection.fetch({
            data: {
                app: 'splunk_monitoring_console',
                owner: 'nobody',
                search: 'name="DMC Forwarder - Build Asset Table"'
            },
            success: successFn,
            error: function() {
                throw new Error("Savedsearch fetch failed");
            }
        });
    };

    $setupButton.click(function(e) {
        e.preventDefault();
        fetchSavedSearch(function(collection) {
            savedSearchesCollection.add([collection.models[0]]);
            Promise.all([serverInfo.dfd, application.dfd]).then(function() {
                //when all models are fetched and ready:
                if (setupModal) {
                    setupModal.hide();
                    setupModal = null;
                }

                var setupModal = new SetupModal({
                    backdrop: 'static',
                    keyboard: true,
                    model: {
                        application: application,
                        savedSearch: savedSearchesCollection.models[0],
                        serverInfo: serverInfo
                    },
                    onHiddenRemove: true
                });

                $('body').append(setupModal.render().el);
                setupModal.show();
            });
        });
    });
});