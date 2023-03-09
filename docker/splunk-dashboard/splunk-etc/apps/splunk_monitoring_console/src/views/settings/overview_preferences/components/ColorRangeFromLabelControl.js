define([
        'underscore',
        'module',
        'backbone',
        '@splunk/swc-mc',
        'bootstrap'
    ],
    function(
        _,
        module,
        Backbone,
        SwcMC,
        undefined
        ) {

        return SwcMC.ColorRangeLabelControlView.extend({

            render: function() {
                this.$('.text-value').tooltip('destroy');
                this.$el.html(this.compiledTemplate({
                    value: parseInt(this.model.get('value'), 10) + 1,
                    label: this.options.label,
                    customClass: this.options.customClass || 'color-control-left-col'
                }));
                this.$('.text-value').tooltip({ animation: false, container: 'body' });
                return this;
            }
        });

    });