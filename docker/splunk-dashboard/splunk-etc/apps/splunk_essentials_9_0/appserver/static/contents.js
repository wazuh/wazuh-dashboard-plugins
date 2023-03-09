// TODO: This is lifted mostly from SimpleXML Examples App (Splunkbase #1604) and could easily be
// rewritten in vanilla JS without any dependencies in 20 lines. Next dev, please do that.
require([
    'jquery',
    'underscore',
    'splunkjs/mvc/simplexml/controller',
    'splunk.util',
    'backbone',
    'bootstrap.affix',
    'bootstrap.scrollspy'
], function($, _, DashboardController, SplunkUtil, Backbone) {
    // Lifted from DashboardsCollection
    var search = '(isDashboard=1 AND ((rootNode="dashboard" AND version!=2) OR rootNode="form" OR rootNode="view" OR rootNode="html") AND isVisible=1)';
    var HIDE_MISSING_VIEWS = false;

    DashboardController.onReady(function() {
        DashboardController.onViewModelLoad(function() {
            var app = DashboardController.model.app.get('app');
            var view = DashboardController.model.view;
            var dashboardsCollection = new Backbone.Collection();
            // Isn't very robust but can't use packages without a bundler.
            // TODO: Use: https://splunkui.splunkeng.com/Packages/splunk-utils/URL#api-createURL
            dashboardsCollection.url = '/en-US/splunkd/__raw/servicesNS/-/' + app + '/data/ui/views?output_mode=json&count=0&search=' + search,
            dashboardsCollection.parse = function(data) { return data.entry; };
            var exampleInfoCollection = new Backbone.Collection();
            exampleInfoCollection.url = SplunkUtil.make_url('/static/app/' + app + '/exampleInfo.json');
            $.when(exampleInfoCollection.fetch(), dashboardsCollection.fetch()).then(function() {
                var categories = _.uniq(exampleInfoCollection.pluck('category'));
                var $nav = $('<ul class="nav nav-list"></ul>').data('offset-top', "50");
                var $contents = $('<div class="example-contents"></div>');
                _.each(categories, function(category) {
                    var categoryFiltered = exampleInfoCollection.filter(function(exampleInfo) {
                        return exampleInfo.get("category") === category;
                    });
                    $nav.append($('<li></li>').append($('<a ></a>').attr('href', '#' + category.replace(/ /g, "_")).text(category)));
                    var categoryInfoCollection = new Backbone.Collection(categoryFiltered);
                    var $category = $('<section></section>').attr('id', category.replace(/ /g, "_"));
                    $category.append($("<h2></h2>").text(category));
                    var $categoryContents = $('<div class=""></div>').appendTo($category);
                    categoryInfoCollection.each(function(exampleInfo) {
                        var id = exampleInfo.get('id');
                        var $example = $('<a class="example"></a>').attr('href', id);
                        var view = dashboardsCollection.find(function(m) { return m.get('name') === id; });
                        if (!view) {
                            if (HIDE_MISSING_VIEWS) { return; }
                            $example.addClass('missing').attr("title", "Example view is not available!");
                        }
                        var label = exampleInfo.get('title') || (view && view.content.get('label') || id);
                        var $exampleTitle = $('<h3></h3>').text(label);
                        var $exampleImg = $('<img />').attr('src', SplunkUtil.make_url('/static/app/' + app + '/icons/' + (exampleInfo.get('description-icon') || exampleInfo.get('id') + ".png")));
                        var $exampleDescription = $('<p></p>').html(exampleInfo.get('short-description'));
                        var $exampleContent = $('<div class="content"></div>').append($exampleTitle).append($exampleDescription);
                        $example.append($exampleImg).append($exampleContent);
                        $categoryContents.append($example);
                    });
                    $contents.append($category);
                });
                $('.dashboard-body').append($('<div class="row contents-body"></div>').append($('<div class="nav-bar-slide"></div>').append($nav)).append($contents));
                $nav.affix({
                    offset: { top: $nav.offset().top }
                })
                $('body').scrollspy();
            });
        });
    });
});