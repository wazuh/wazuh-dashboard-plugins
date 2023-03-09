// this is to control the 'host' and 'server_name' token
define(
    [
        'jquery',
        'underscore',
        'splunkjs/mvc',
        'uri/route',
        'splunkjs/mvc/sharedmodels',
        'util/console',
        'splunk.util',
        'splunkjs/mvc/simplexml/ready!'
    ],
    function(
        $,
        _,
        mvc,
        route,
        sharedModels,
        console,
        SplunkUtil
    ) {
        // TODO: for some reason both defaultModel and submittedModel are needed
        var submittedModel = mvc.Components.getInstance('submitted');
        var defaultModel = mvc.Components.getInstance('default');

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
            'padding': '10px 0 0 0',
            'font-weight': 'bold'
        }).parent().css({
            'background-color': 'inherit',
            'border': 'none'
        });
        $("h2.panel-title:contains('Historical Charts')").css({
            'border-bottom': 'none',
            'padding': '10px 0 0 0',
            'font-weight': 'bold'
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

        $('.dashboard-body').on('click', '.scroll', function(e) {
            e.preventDefault();
            var anchorId = $(SplunkUtil.escapeSelector(e.currentTarget)).attr('href');
            $('html, body').animate({scrollTop: $(anchorId).offset().top}, 'slow');
            return false;
        });
    }
);