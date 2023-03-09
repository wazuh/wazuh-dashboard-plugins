/**
 * Created by ykou on 11/6/15.
 */
define([
    'underscore',
    '@splunk/swc-mc'
], function(
    _,
    SwcMC
) {
    return SwcMC.PopTartView.extend({
        initialize: function() {
            SwcMC.PopTartView.prototype.initialize.apply(this, arguments);

            this.listenTo(this.model, 'change', this.render);
        },
        render: function() {
            var $detailContent;

            var detail = this.model.get('detail');

            if (_.isArray(detail)) {
                $detailContent = _.reduce(detail, function(acc, row) {
                    return acc + '<div>' + row + '</div>';
                }, '');
            }
            else {
                $detailContent = detail;
            }

            this.$el.html(this.compiledTemplate({
                detail: $detailContent
            }));
            return this;
        },
        template:
            '<div class="arrow"></div>\
             <div class="dmc-kpi-item-tooltip"><%= detail %></div>'
    });
});