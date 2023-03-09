define([
    'underscore',
    'jquery',
    'backbone',
    'splunk_monitoring_console/views/overview/Alerts_old',
    'splunkjs/mvc/sharedmodels',
    'splunkjs/mvc/simplexml/ready!'
], function(
    _,
    $,
    Backbone,
    AlertsView,
    SharedModels){


    // Init objects
    var model = {};

    model.serverInfoModel = SharedModels.get('serverInfo');
    model.serverInfoModel.dfd.then(function() {

        // Create the alert view and attach to the dashboard
        var alertsView = new AlertsView({
            model: {
                serverInfo: model.serverInfoModel
            }
        });

        $('.dmc-alerts-section').append(alertsView.render().$el);

    });


});
