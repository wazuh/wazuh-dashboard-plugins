/**
 * @author atruong
 * @date 8/05/15
 */
 define([
 	'underscore',
 	'module',
    '@splunk/swc-mc',
    'contrib/text!./Master.html',
    'splunk_monitoring_console/views/settings/overview_preferences/Grid'
 ], function(
 	_,
 	module,
 	SwcMC,
 	template,
 	GridView
 ){
 	return SwcMC.BaseView.extend({
 		moduleId: module.id,
 		template: template,

 		initialize: function(options) {
			SwcMC.BaseView.prototype.initialize.call(this, options);

 			this.children.gridView = new GridView({
                collection: { thresholdConfigs: this.collection.thresholdConfigs }
 			});

			this.children.textNameFilter = new SwcMC.TextControlView({
				model: this.collection.thresholdConfigs.fetchData,
				modelAttribute: 'searchFilter', 
				inputClassName: 'search-query',
				canClear: true,
				placeholder: _('filter').t()
			});

			this.children.collectionPaginatorView = new SwcMC.CollectionPaginatorView({
				collection: this.collection.thresholdConfigs
			});

			this.children.selectPageCountView = new SwcMC.SyntheticSelectControlView({
                modelAttribute: 'count',
                model: this.collection.thresholdConfigs.fetchData,
                items: [
                    { value: 10, label: _('10 Per Page').t() },
                    { value: 25, label: _('25 Per Page').t() },
					{ value: 50, label: _('50 Per Page').t() },
					{ value: 100, label: _('100 Per Page').t() }
                ],
                save: false,
                elastic: true,
                menuWidth: 'narrow',
                className: 'btn-group pull-left',
                toggleClassName: 'btn-pill'
            });

			this.children.collectionCountView = new SwcMC.CollectionCountView({
				collection: this.collection.thresholdConfigs,
				countLabel: _('mappings').t()
			});

 		},

 		render: function() {
 			var html = this.compiledTemplate();

 			this.$el.html(html);

 			if (this.children.gridView) {
 				this.children.gridView.detach();
            }

 			if (this.children.textNameFilter) {
 				this.children.textNameFilter.detach();
            }

 			if (this.children.collectionCountView) {
 				this.children.collectionCountView.detach();
            }

 			if (this.children.collectionPaginatorView) {
 				this.children.collectionPaginatorView.detach();
            }

 			if (this.children.selectPageCountView) {
 				this.children.selectPageCountView.detach();
            }

 			this.children.gridView.render().appendTo(this.$('.grid-placeholder.threshold-config'));
 			this.children.textNameFilter.render().appendTo(this.$('.text-name-filter-placeholder.threshold-config'));
 			this.children.collectionPaginatorView.render().appendTo(this.$('.paginator-container.threshold-config'));
            this.children.collectionCountView.render().appendTo(this.$('.collection-count.threshold-config'));
            this.children.selectPageCountView.render().appendTo(this.$('.select-page-count.threshold-config'));

 			return this;
 		}
 	});
 });