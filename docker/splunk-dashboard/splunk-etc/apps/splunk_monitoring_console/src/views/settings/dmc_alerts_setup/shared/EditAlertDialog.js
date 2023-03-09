/**
 * @author atruong
 * @date 4/25/15
 *
 * Confirmation dialog for enabling a preconfigured dmc alert
 */

define([
	'jquery',
	'underscore',
	'backbone',
	'module',
	'@splunk/swc-mc'
], function (
	$,
	_,
	Backbone,
	module,
	SwcMC
) {

    var licenseUsageSearchStringForCloud = '| rest splunk_server_group=dmc_group_license_master services/licenser/usage/license_usage | \
        fields slaves_usage_bytes, quota | eval usedGB=round(slaves_usage_bytes/1024/1024/1024,3) | \
        eval totalGB=round(quota/1024/1024/1024,3) | eval percentage=round(usedGB / totalGB, 3)*100 | \
        fields percentage, usedGB, totalGB | where percentage > 90';

	return SwcMC.ModalView.extend({
		moduleId: module.id,
        className: SwcMC.ModalView.CLASS_NAME + ' edit-dialog-modal modal-wide',

		initialize: function (options) {
			SwcMC.ModalView.prototype.initialize.apply(this, arguments);
			this.children.flashMessagesView = new SwcMC.FlashMessagesView({ model: { alert: this.model.alert, alertConfig: this.model.alertConfig }});
			this.alertName = this.model.alert.entry.get('name');
		},

		events: $.extend({}, SwcMC.ModalView.prototype.events, {
			'click .modal-btn-save': function (e) {
				e.preventDefault();
				if (this._allInputsValid) {
					var dscrptnToSrchFactors = this.model.alertConfig.entry.content.get('param_to_search_conversion').split(','),
						description = this.model.alertConfig.entry.content.get('description_template'),
						search = this.model.alertConfig.entry.content.get('search_template');

					for (var i = 0; i < dscrptnToSrchFactors.length; i++) {
						var val = parseFloat(this.$('#input-' + i).val()),
							searchVal = this._applySearchConversion(val, dscrptnToSrchFactors[i]),
							placeholder = new RegExp('\\{' + i + '\\}', 'g');

						description = description.replace(placeholder, val);
						search = search.replace(placeholder, searchVal);
					}

	                // Cloud admins (sc_admin) don't have license_edit capabilities so they can't access normal licensing endpoints
	                // The /services/licenser/usage endpoint is only available on splunk 6.3+, and so for backward compatibility, we only use this endpoint on the Cloud.
                    if ((this.alertName === 'DMC Alert - Total License Usage Near Daily Quota') && (this.model.serverInfo.isCloud())) {
                        search = licenseUsageSearchStringForCloud.replace('90', searchVal.toString());
                    }

					this.model.alert.entry.content.set({'search': search, 'description': description});
					this.model.alert.save().done(_(function () {
						this.updateSaveFailedMessage(false);
						this.hide();
					}).bind(this)).fail(_(function () {
						this.updateSaveFailedMessage(true);
					}).bind(this));
				}
			}
		}),

		_allInputsValid: true,

		_applySearchConversion: function (dscrptnVal, conversionStr) {
			var expressions = conversionStr.split('|');
			for (var i = 0; i < expressions.length; i++) {
				var expr = expressions[i].split(' ');
				var operand = parseFloat(expr[1]);
				switch (expr[0]) {
					case '+':
						dscrptnVal += operand;
						break;
					case '*':
						dscrptnVal *= operand;
						break;
					default:
						break;
				}
			}
			return dscrptnVal;
		},

		updateSaveFailedMessage: function (failed, errorMessage) {
	        if (failed) {
	            var errMessage = errorMessage ? errorMessage : _('Failed to save changes to alert.').t();
	            this.children.flashMessagesView.flashMsgHelper.addGeneralMessage('save_failed',
	                {
	                    type: SwcMC.SplunkdUtils.ERROR,
	                    html: errMessage
	                });
	        } else {
	            this.children.flashMessagesView.flashMsgHelper.removeGeneralMessage('save_failed');
	        }
	    },

		render: function () {
			var BUTTON_SAVE = '<a href="#" id="save-edit-btn" class="btn btn-primary modal-btn-save modal-btn-primary">' + _('Save').t() + '</a>';

			this.$el.html(SwcMC.ModalView.TEMPLATE);
			this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html( _('Edit Alert: ').t() + this.alertName);
			this.$(SwcMC.ModalView.BODY_SELECTOR).show();
			this.$(SwcMC.ModalView.BODY_SELECTOR).append(SwcMC.ModalView.FORM_HORIZONTAL);

			this._renderContent();
			this.children.flashMessagesView.render().appendTo(this.$('.flash-messages-view-placeholder'));

            this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(SwcMC.ModalView.BUTTON_CANCEL);
			this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(BUTTON_SAVE);

			return this;
		},

		_renderContent: function () {
			// parsing conf file input
			var description = this.model.alertConfig.entry.content.get('description_template'),
				parameterVals = this.extractParamValsFromAlert(),
			 	parameterLabels = this.model.alertConfig.entry.content.get('parameter_labels').split(','),
				parameterRanges = _.map(this.model.alertConfig.entry.content.get('parameter_ranges').split(','), _(function(range) {
					return this._parseRange(range);
				}).bind(this));

			if (!parameterVals) {
				parameterVals = this.model.alertConfig.entry.content.get('parameter_values').split(',');
				this.updateOutOfSyncMessage(true);
			} else {
				this.updateOutOfSyncMessage(false);
			}

			// appending description to dom with class identifiers for different thresholds
			for (var j = 0; j < parameterVals.length; j++) {
				var placeholder = new RegExp('\\{' + j + '\\}', 'g');
				description = description.replace(placeholder, '<span class="value-placeholder value-' + j + '">' + _.escape(parameterVals[j]) + '</span>');
			}

			// generating modal html from template
			this.$(SwcMC.ModalView.BODY_FORM_SELECTOR).html(_(this.dialogFormBodyTemplate).template({
				name: this.model.alert.entry.get('name'),
				description: description,
				parameterLabels: parameterLabels,
				parameterVals: parameterVals,
				parameterRanges: parameterRanges
			}));

			// attaching event listeners to dynamically update modal content
			// in response to user input
			for (var i = 0; i < parameterLabels.length; i++) {
				var inputSelector = '#input-' + i,
					valueSelector = '.value-' + i,
					helpSelector = '#help-' + i,
					range = parameterRanges[i];

				this.$(inputSelector).keyup(_(function(){
					var val = _.escape(this.$(inputSelector).val());
					this.$(valueSelector).html(val);
					if (!this._isValidEntry(val, range.min, range.max)) {
						this.$('#save-edit-btn').addClass('disabled');
						this.$(valueSelector).removeClass('value-placeholder').addClass('invalid');
						this.$(helpSelector).addClass('invalid');
						this._allInputsValid = false;
					} else {
						this.$('#save-edit-btn').removeClass('disabled');
						this.$(valueSelector).removeClass('invalid').addClass('value-placeholder');
						this.$(helpSelector).removeClass('invalid');
						this._allInputsValid = true;
					}
				}).bind(this));
			}
		},

		// extracts the parameter values for the thresold parameters from the alert model's description
		// by matching it against the description_template
		// expects an exact match; if an exact match isn't found, then it returns null
		// assumes that all parameterized values in the search_template will also appear in the description_template
		extractParamValsFromAlert: function () {
			// for each element in the extractedVals array, there is a corresponding integer in this indices array
			// that represents that element's position in the paramVals array (i.e. the index at which its corresponding
			// labels and ranges are in the arrays derived from the alertConfig model)
			// this exists to handle the case where the same parameter is referenced twice in the description
			var indices = [],
				// gets the description_template from the associated alert_template model, and
				// escapes it to be usable as a regex
				descriptionTemplate = this._escapeRegExpForExactMatch(this.model.alertConfig.entry.content.get('description_template')),
				description = this.model.alert.entry.content.get('description'),
				// for each substring of the description template that matches the \{<order-number>\} format,
				// extract the order-number from that substring by removing the enclosing characters and pushing it
				// to the indices array and replace that substring with the (\d+)
				// create descriptionRegExp, a RegExp object, with this modified string
				// descriptionRegExp will capture the parameter values from an alert description string that
				// matches the template exactly
				descriptionRegExp = new RegExp(descriptionTemplate.replace(/\\\{\d+\\\}/g, function(matched) {
					indices.push(parseInt(matched.substring(2, matched.length - 2), 10));
					return '(\\d+\\.\\d+|\\d+)';
				})),
				// execute descriptionRegExp on description
				extractedVals = descriptionRegExp.exec(description),
				// array of parameter values to be returned
				paramVals = [];

			if (!_.isNull(extractedVals)) {
				// captured value arrays returned from a RegExp always have the original matched string
				// at index 0, so shift the array to discard that element
				extractedVals.shift();

				// for each of the extracted values, place it into the correct index in the paramVals
				// array using the corresponding element in the indices array
				for (var i = 0; i < indices.length; i++) {
					var idx = indices[i];
					if (_.isUndefined(paramVals[idx])) {
						paramVals[idx] = extractedVals[i];
					} else if (paramVals[idx] !== extractedVals[i]) {
						// two values belonging to the same index should be the same value
						// if they're not, then the savedsearch description is no longer in
						// sync with that the template expects
						return null;
					}
				}
				return paramVals;
			}
			return null;
		},

		// Given a string, this function escapes any character that is a special regex character with
		// a backslash so that string to be used as a regex that expects an exact match.
		// Eg:
		// input: 'You have licenses that expire or will expire within {0} weeks.'
		// output: '^You\ have\ licenses\ that\ expire\ or\ will\ expire\ within\ \{0\}\ weeks\.$'
		_escapeRegExpForExactMatch: function (str) {
     		str = str.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
     		str = '^' + str + '$';
     		return str;
		},

		_parseRange: function (rangeStr) {
			if (rangeStr[0] === '>') {
				var min = parseFloat(rangeStr.split('>')[1]);
				return {
					helpText: _('Value must be a number greater than ').t() + min,
					min: min
				};
			}

			var minMaxArr = rangeStr.split('-');
			if(minMaxArr.length === 2) {
				return {
					min: parseFloat(minMaxArr[0]),
					max: parseFloat(minMaxArr[1]),
					helpText: _('Value must be a number in the range of ').t() + rangeStr
				};
			}
		},

		updateOutOfSyncMessage: function (outOfSync) {
			if (outOfSync) {
	            var errMessage = _('Warning: one or both of your alert description or search query has been changed\
	            	from the preconfigured settings. Modifying the alert through this dialog will reset these\
	            	attributes to their original form.').t();
	            this.children.flashMessagesView.flashMsgHelper.addGeneralMessage('out_of_sync',
	                {
	                    type: SwcMC.SplunkdUtils.ERROR,
	                    html: errMessage
	                });
	        } else {
	            this.children.flashMessagesView.flashMsgHelper.removeGeneralMessage('out_of_sync');
	        }

		},

		_isValidEntry: function (numStr, min, max) {
			if(!_.isNaN(+numStr)) {
                var numVal = parseFloat(numStr);
                // SPL-188423 Fixed validation for comparison type ranges
                // Comparison of > should not validate as >=
				if (_.isUndefined(max) && numVal <= min) {
					return false;
				}
				if (!_.isUndefined(max) && (numVal < min || numVal > max)) {
					return false;
				}
				return true;
			}
			return false;
		},


		dialogFormBodyTemplate: '\
			<div class="flash-messages-view-placeholder"></div>\
			<label class="label-block" id="description"><%= _("Description").t() %></label>\
			<span class="value-block text"><%= description %></span>\
			<hr/>\
			<div class="header-text"><%= _("Alert Thresholds").t() %></div>\
			<div class="params-container">\
			<% for (var i = 0; i < parameterLabels.length; i++) { %>\
			<label class = "label-block"><%= parameterLabels[i] %></label>\
			<span class="value-block input"><input id="input-<%= i %>" type="text" value="<%= parameterVals[i] %>" />\
			<div class="help-text-block" id="help-<%= i %>"><%= parameterRanges[i].helpText %></div></span>\
			<% } %>\
			</div>\
		'
	});
});
