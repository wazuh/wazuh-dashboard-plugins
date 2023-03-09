define(
    [
        'jquery',
        'underscore',
        'module',
        '@splunk/swc-mc'
    ],
    function(
        $,
        _,
        module,
        SwcMC
    ) {
        return SwcMC.PopTartView.extend({
            moduleId: module.id,
            className: 'dropdown-menu dropdown-menu-narrow',
            initialize: function(options) {
                options = _.defaults(options, { 
                    mode: 'menu'
                });
                SwcMC.PopTartView.prototype.initialize.call(this, options);
            },
            events: $.extend(SwcMC.PopTartView.prototype.events, {
                'click ul.first-group li': function(e) {
                    var $el = $(e.target).closest('li');

                    e.preventDefault();
                    
                    this.model.state.set('count', +$el.data('value'));
                }
            }),
            render: function() {
                this.el.innerHTML = SwcMC.PopTartView.prototype.template_menu;
                this.$el.append(this.compiledTemplate());
                // Focus on the appropriate value
                _.defer(function() {
                    this.$('a').blur();
                    this.$('li[data-value="' + this.model.state.get('count') + '"] a').focus();
                }.bind(this));
                return this;
            },
            template: '\
                <ul class="first-group">\
                    <li data-value="10"><a href="#">10</a></li>\
                    <li data-value="25"><a href="#">25</a></li>\
                    <li data-value="50"><a href="#">50</a></li>\
                    <li data-value="100"><a href="#">100</a></li>\
                </ul>\
            '
        });
    }
);
