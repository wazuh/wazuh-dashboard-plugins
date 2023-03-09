/**
 * @author atruong
 * @date 8/05/15
 **/

 define([
 	'underscore',
 	'jquery',
 	'module',
 	'@splunk/swc-mc',
 	'splunk_monitoring_console/views/settings/overview_preferences/GridRow',
 	'contrib/text!./Grid.html'
 ], function(
 	_,
 	$,
 	module,
 	SwcMC,
 	GridRow,
 	template
 ){
 	return SwcMC.BaseView.extend({
 		moduleId: module.id,
 		template: template,

 		initialize: function(options) {
			SwcMC.BaseView.prototype.initialize.call(this, options);
 			this.children.columnSort = new SwcMC.ColumnSortView({
 				el: this.el,
 				model: this.collection.thresholdConfigs.fetchData,
 				autoUpdate: true
 			});

 			this.children.flashMessages = new SwcMC.FlashMessagesView({
 				className: 'message-single',
 				collection: {
 					thresholdConfigs: this.collection.thresholdConfigs
 				},
 				helperOptions: {
 					removeServerPrefix: true
 				}
 			});

 			this.listenTo(this.collection.thresholdConfigs, 'change reset', this.debouncedRender);
 		},

 		updateNoThresholdConfigsMessage: function() {
	        if (this.collection.thresholdConfigs.length === 0) {
	            var errMessage = _('No preconfigured color mappings found.').t();
	            this.children.flashMessages.flashMsgHelper.addGeneralMessage('no_threshold_configs',
	                {
	                    type: SwcMC.SplunkdUtils.ERROR,
	                    html: errMessage
	                });
	        } else {
	            this.children.flashMessages.flashMsgHelper.removeGeneralMessage('no_threshold_configs');
	        }
	    },

 		render: function() {
 			var rowIterator = new SwcMC.GridRowIteratorHelper(),
 				html = this.compiledTemplate({
 					sortCellClass: SwcMC.ColumnSortView.SORTABLE_ROW,
 					sortKeyAttribute: SwcMC.ColumnSortView.SORT_KEY_ATTR
 				}),
 				$html = $(html);

 			rowIterator.eachRow(this.collection.thresholdConfigs, function(thresholdConfigModel, thresholdConfig, rowNumber, isExpanded) {
 				var name = thresholdConfigModel.id.split('/').splice(-1)[0];
 				// only generate a row if the thresholdConfigModel is not the default one
 				if(name.indexOf('dmc_rangemap_default') === -1) { 
	 				var gridRow = new GridRow({
	 					model: {thresholdConfig: thresholdConfigModel}
	  				});
	 				$html.find('.grid-table-body').append(gridRow.render().el);
	 			}
 			}, this);

 			this.children.columnSort.update($html);
 			this.$el.html($html);
			this.children.flashMessages.render().appendTo(this.$el);
			this.updateNoThresholdConfigsMessage();

 			return this;
 		}

 	});
 });