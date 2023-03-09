// this is to control the 'host' and 'server_name' token
define(
    [
        'jquery',
        'underscore',
        'splunkjs/mvc',
        'uri/route',
        'splunk_monitoring_console/views/overview/Alerts_old',
        'splunkjs/mvc/sharedmodels',
        'util/console',
        'splunkjs/mvc/simplexml/ready!'
    ],
    function(
        $,
        _,
        mvc,
        route,
        AlertsView,
        sharedModels,
        console
    ) {
        // TODO: for some reason both defaultModel and submittedModel are needed
        var submittedModel = mvc.Components.getInstance('submitted');
        var defaultModel = mvc.Components.getInstance('default');

        // Init objects
        var model = {};

        model.serverInfoModel = sharedModels.get('serverInfo');
        model.serverInfoModel.dfd.then(function() {
            // Create the alert view and attach to the dashboard
            var alertsView = new AlertsView({
                model: {
                    serverInfo: model.serverInfoModel
                }
            });
            $('#alertsPanel').append(alertsView.render().$el);
            $('.smc-alerts-title-section').hide();
        });

        // switch between snapshot and historical
        // make sure data-item=token-name 
        $('#link-switcher-view').on('click', 'a', function(e) {
            e.preventDefault();
            var $target = $(e.target);
            if ($target.hasClass('active')) { return ;}

            // remove siblings tokens
            $target.siblings('a.btn-pill').removeClass('active');
            $target.siblings('a.btn-pill').each(function(index, element) {
                var item = $(element).data('item');
                defaultModel.unset(item);
                submittedModel.unset(item);
            });

            // set token for clicked pill
            $target.addClass('active');
            defaultModel.set($target.data('item'), true);
            submittedModel.set($target.data('item'), true);
        });

        // workaround: hide panel background to make it looks like a section title
        $("h2.panel-title:contains('Snapshots')").css({
            'border-bottom': 'none',
            'padding': '10px 0 0 0'
        }).parent().css({
            'background-color': 'inherit',
            'border': 'none',
            'padding-bottom': '10px'
        });
        $("h2.panel-title:contains('Historical')").css({
            'border-bottom': 'none',
            'padding': '10px 0 0 0'
        }).parent().css({
            'background-color': 'inherit',
            'border': 'none'
        });
        $("h2.panel-title:contains('Search Activity')").css({
            'border-bottom': 'none',
            'padding': '0 0 10px 0'
        }).parent().css({
            'background-color': 'inherit',
            'border': 'none'
        });
        $("h2.panel-title:contains('Scheduler Activity')").css({
            'border-bottom': 'none',
            'padding': '10px 0 10px 0'
        }).parent().css({
            'background-color': 'inherit',
            'border': 'none'
        });

        // process class learnMore link
        var application = sharedModels.get('app');
        var learnMoreLink = route.docHelp(
            application.get('root'),
            application.get('locale'),
            'app.management_console.resource_usage_process_class'
        );
        $('.dmc_process_class_learn_more').attr('href', learnMoreLink);

        // from tokenlinks.js
        function setToken(name, value) {
            var defaultTokenModel = mvc.Components.get('default');
            if (defaultTokenModel) {
                defaultTokenModel.set(name, value);
            }
            var submittedTokenModel = mvc.Components.get('submitted');
            if (submittedTokenModel) {
                submittedTokenModel.set(name, value);
            }
        }
        $('.dashboard-body').on('click', '[data-set-token],[data-unset-token],[data-token-json]', function(e) {
            e.preventDefault();
            var target = $(e.currentTarget);
            var setTokenName = target.data('set-token');
            if (setTokenName) {
                setToken(setTokenName, target.data('value'));
            }
            var unsetTokenName = target.data('unset-token');
            if (unsetTokenName) {
                setToken(unsetTokenName, undefined);
            }
            var tokenJson = target.data('token-json');
            if (tokenJson) {
                try {
                    if (_.isObject(tokenJson)) {
                        _(tokenJson).each(function(value, key) {
                            if (value == null) {
                                // Unset the token
                                setToken(key, undefined);
                            } else {
                                setToken(key, value);
                            }
                        });
                    }
                } catch (err) {
                    console.warn('Cannot parse token JSON: ', err);
                }
            }
        });
    }
);
