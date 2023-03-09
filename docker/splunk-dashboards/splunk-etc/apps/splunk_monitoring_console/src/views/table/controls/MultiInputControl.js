define(
	[
		'underscore',
		'module',
		'@splunk/swc-mc',
		'splunk_monitoring_console/views/controls/Multiselect'
	],
	function(
		_,
		module,
		SwcMC,
		MultiSelect
	) {
		return SwcMC.BaseView.extend({
			moduleId: module.id,
			initialize: function() {
				SwcMC.BaseView.prototype.initialize.apply(this, arguments);
				this.options.placeholder = this.options.placeholder || _("Choose groups").t();
				this.populateCollectionTags();
				this.collection.on('change:' + this.options.modelAttribute, this.updateTags, this);
				this.options.component = this.createMultiSelectControl();
			},
			updateTags: function() {
				this.populateCollectionTags();
				this.debouncedRender();
			},

			populateCollectionTags: function() {
				this.options.autoCompleteFields = this.collection[this.options.collectionMethod].call(this.collection);
			},

			createMultiSelectControl: function() {
				var multiSelectChildren = this.options.autoCompleteFields.map(function(child) {
                    return {
                        value: child,
                        label: child,
                        key: child,
                    };
                });
                var handleMultiSelectChanged = function(e, value) {
                    // sui component passes an array, model is stored as csv
                    var values = value.values.join(',');
                    this.options.model.set(this.options.modelAttribute, values);
                };

                // sui component accepts an array for default values, model is stored as csv
                var controlValues = this.options.model.get(this.options.modelAttribute) || "";
                var defaultControlValues = controlValues === "" ? undefined : controlValues.split(',');

				return new MultiSelect({
                    children: multiSelectChildren,
                    props: {
						"data-test-name": this.options.dataTestName ? this.options.dataTestName : "",
						allowNewValues: !!this.options.allowNewValues,
                        inline: true,
                        defaultValues: defaultControlValues,
                        onChange: handleMultiSelectChanged.bind(this),
                        placeholder: this.options.placeholder || _("Choose groups").t(),
                        style: {
                            width: '100%'
                        }
                    },
                    stretchToFill: true
                });
			}
		})
	}
);