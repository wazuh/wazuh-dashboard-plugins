define(
	[
		'underscore',
		'backbone',
		'module',
		'splunk_monitoring_console/collections/Instances',
		'@splunk/swc-mc',
		'splunk_monitoring_console/views/overview/distributed_mode/topology/instancelist/Master',
		'splunk_monitoring_console/views/overview/distributed_mode/topology/InstanceLinks',
		'splunk_monitoring_console/views/overview/distributed_mode/topology/StatusFilter',
		'contrib/text!splunk_monitoring_console/views/overview/distributed_mode/topology/Master.html',
		'splunk_monitoring_console/helpers/ThresholdConfigsClient'
	],
	function(
		_,
		Backbone,
		module,
		InstancesCollection,
		SwcMC,
		InstanceListView,
		InstanceLinksView,
		StatusFilterView,
		Template,
		ThresholdConfigsClientHelper
	) {
		var SVG_DEFAULT_WIDTH = 750,
      		SVG_MIN_HEIGHT = 500,
      		AUXILIARY_SVG_DEFAULT_WIDTH = 300,
      		AUXILIARY_SVG_MIN_HEIGHT = 325,
      		LIST_HEIGHT_BUFFER = 50,
      		INDEXERS_TITLE = _('Indexers').t(),
      		SEARCH_HEADS_TITLE = _('Search heads').t(),
      		AUXILIARY_TITLE = _('Other').t();

      	// The following utilities exist because our views do not support
      	// re-rendering them in a new container - the backbone events get detached.
      	// Calling delegateEvents on the control will allow it to be re-rendered in a
      	// container that is built from scratch every render.
      	var recursiveDelegateEvents = function(view) {
      		view.delegateEvents();
      		_.each(view.children, function(child) {
      			recursiveDelegateEvents(child);
      		});
      	};
      	var createRerenderableControl = function(controlClass) {
      		return controlClass.extend({
      			render: function() {
	      			var control = controlClass.prototype.render.apply(this, arguments);
	      			recursiveDelegateEvents(control);
	      			return control;
	      		}
      		});
      	};
      	var RerenderableTextControl = createRerenderableControl(SwcMC.TextControlView);
      	var RerenderableSyntheticSelectControl = createRerenderableControl(SwcMC.SyntheticSelectControlView);

		/*
		/*
		 * Master view for topology.
		 * Coordinates interactions between various SVG components
		 * in a single SVG container.
		 */
		return SwcMC.BaseView.extend({
			className: 'dmc-topology',
			moduleId: module.id,

			initialize: function() {
				SwcMC.BaseView.prototype.initialize.apply(this, arguments);
				this.model.textFilter = new SwcMC.BaseModel({
					indexers: '',
					searchHeads: ''
				});

				// Initialize child views
				this.children.searchHeadToIndexerLinks = new InstanceLinksView({
					collections: [
						this.collection.indexers,
						this.collection.searchHeads
					],
					relations: ['searchedBy', 'distributesSearchesTo']
				});

				this.children.indexerList = new InstanceListView({
					model: {
						state: this.model.state,
						fetchState: this.model.indexerFetchState,
						thresholdConfig: this.model.thresholdConfig
					},
					collection: {
						instances: this.collection.indexers
					},
					xOffset: 20,
					yOffset: 0,
					instanceAnchorPosition: 'right'
				});
				this.children.searchHeadList = new InstanceListView({
					model: {
						state: this.model.state,
						fetchState: this.model.searchHeadFetchState,
						thresholdConfig: this.model.thresholdConfig
					},
					collection: {
						instances: this.collection.searchHeads
					},
					xOffset: 450, // MAGIC_NUMBER
					yOffset: 0,
					instanceAnchorPosition: 'right'
				});
				this.children.auxiliaryList = new InstanceListView({
					model: {
						state: this.model.state,
						fetchState: this.model.auxiliaryFetchState,
						thresholdConfig: this.model.thresholdConfig
					},
					collection: {
						instances: this.collection.auxiliaries
					},
					instanceAnchorPosition: 'auto'
				});

				this.children.indexerStatusFilter = new StatusFilterView({
					collection: {
						instances: this.collection.indexers
					},
					dataType: 'indexer',
					model: {
						fetchState: this.model.indexerFetchState,
						thresholdConfig: this.model.thresholdConfig
					}
				});
				this.children.searchHeadStatusFilter = new StatusFilterView({
					collection: {
						instances: this.collection.searchHeads
					},
					dataType: 'search-head',
					model: {
						fetchState: this.model.searchHeadFetchState,
						thresholdConfig: this.model.thresholdConfig
					}
				});
				this.children.auxiliaryStatusFilter = new StatusFilterView({
					collection: {
						instances: this.collection.auxiliaries
					},
					dataType: 'auxiliary',
					model: {
						fetchState: this.model.auxiliaryFetchState,
						thresholdConfig: this.model.thresholdConfig
					}
				});
				this.children.indexerTextFilter = new RerenderableTextControl({
					placeholder: _('Filter').t(),
					canClear: true,
					model: this.model.textFilter,
					modelAttribute: 'indexers'
				});
				this.children.searchHeadTextFilter = new RerenderableTextControl({
					placeholder: _('Filter').t(),
					canClear: true,
					model: this.model.textFilter,
					modelAttribute: 'searchHeads'
				});

				this.children.indexerStatusSelect = new RerenderableSyntheticSelectControl({
					items: [
						ThresholdConfigsClientHelper.getStatusItem('serverName'),
						ThresholdConfigsClientHelper.getStatusItem('up_down_status'),
						ThresholdConfigsClientHelper.getStatusItem('indexing_rate'),
						ThresholdConfigsClientHelper.getStatusItem('cpu_system_pct'),
						ThresholdConfigsClientHelper.getStatusItem('mem_used')
					],
					model: this.model.indexerFetchState,
					modelAttribute: 'sortKey',
					toggleClassName: 'btn',
					className: 'dmc-topology-filter-select'
				});
				this.children.searchHeadStatusSelect = new RerenderableSyntheticSelectControl({
					items: [
						ThresholdConfigsClientHelper.getStatusItem('serverName'),
						ThresholdConfigsClientHelper.getStatusItem('up_down_status'),
						ThresholdConfigsClientHelper.getStatusItem('search_concurrency'),
						ThresholdConfigsClientHelper.getStatusItem('cpu_system_pct'),
						ThresholdConfigsClientHelper.getStatusItem('mem_used')
					],
					model: this.model.searchHeadFetchState,
					modelAttribute: 'sortKey',
					toggleClassName: 'btn',
					className: 'dmc-topology-filter-select'
				});
				this.children.auxiliaryStatusSelect = new RerenderableSyntheticSelectControl({
					items: [
						ThresholdConfigsClientHelper.getStatusItem('serverName'),
						ThresholdConfigsClientHelper.getStatusItem('up_down_status'),
						ThresholdConfigsClientHelper.getStatusItem('cpu_system_pct'),
						ThresholdConfigsClientHelper.getStatusItem('mem_used')
					],
					model: this.model.auxiliaryFetchState,
					modelAttribute: 'sortKey',
					className: 'dmc-topology-filter-select',
					toggleClassName: 'btn',
					// Otherwise the menu gets cut off when opened.
					popdownOptions: {
						attachDialogTo: 'body'
					}
				});

				this.children.auxiliaryTypeSelect = new RerenderableSyntheticSelectControl({
					items: [
						{ value: 'shc_deployer,cluster_master,license_master,deployment_server', label: _('All types').t() },
						{ value: 'license_master', label: _('License managers').t() },
						{ value: 'cluster_master', label: _('Cluster managers').t() },
						{ value: 'shc_deployer', label: _('Search head deployers').t() },
						{ value: 'deployment_server', label: _('Deployment servers').t() }
					],
					model: this.model.auxiliaryFetchState,
					modelAttribute: 'managementRoles',
					className: 'dmc-topology-filter-select',
					toggleClassName: 'btn',
					popdownOptions: {
						attachDialogTo: 'body'
					}
				});

				// Set up listeners
				this.listenTo(this.collection.indexers, 'sync', _.debounce(this._renderIndexerTitle));
				this.listenTo(this.collection.searchHeads, 'sync', _.debounce(this._renderSearchHeadTitle));
				this.listenTo(this.collection.auxiliaries, 'sync', _.debounce(this._renderAuxiliaryTitle));

				this.listenTo(this.model.state, 'change:showTopology', this.debouncedRender);

				this.listenTo(this.model.textFilter, 'change:indexers', this._updateIndexersTextFilter);
				this.listenTo(this.model.textFilter, 'change:searchHeads', this._updateSearchHeadsTextFilter);

				this.children.indexerList.on('render', this._resizeMainBackground, this);
				this.children.searchHeadList.on('render', this._resizeMainBackground, this);
				this.children.auxiliaryList.on('render', this._resizeOtherBackground, this);

				this.children.indexerStatusSelect.on('change', this._resetIndexerRanges, this);
				this.children.searchHeadStatusSelect.on('change', this._resetSearchHeadRanges, this);
				this.children.auxiliaryStatusSelect.on('change', this._resetAuxiliaryRanges, this);
				this.children.auxiliaryTypeSelect.on('change', this._resetAuxiliaryRanges, this);

				this.children.searchHeadToIndexerLinks.setSvgListViews([
					this.children.indexerList,
					this.children.searchHeadList
				]);
			},

			render: function() {
				this.$el.empty().hide();

				if (this.model.state.get('showTopology')) {
					this.$el.html(this.compiledTemplate());
					this._renderTitles();

					this.$('.dmc-topology-indexers-section').append(this.children.indexerStatusFilter.render().$el);
					this.$('.dmc-topology-search-heads-section').append(this.children.searchHeadStatusFilter.render().$el);
					this.$('.dmc-topology-auxiliaries-section').append(this.children.auxiliaryStatusFilter.render().$el);

					this.$('.dmc-topology-indexers-filter').append(this.children.indexerTextFilter.render().$el);
					this.$('.dmc-topology-search-heads-filter').append(this.children.searchHeadTextFilter.render().$el);

					this.$('.dmc-topology-indexer-threshold-filter').append(this.children.indexerStatusSelect.render().$el);
					this.$('.dmc-topology-search-head-threshold-filter').append(this.children.searchHeadStatusSelect.render().$el);
					this.$('.dmc-topology-auxiliaries-threshold-filter').append(this.children.auxiliaryStatusSelect.render().$el);

					this.$('.dmc-topology-auxiliaries-type-filter').append(this.children.auxiliaryTypeSelect.render().$el);

					// Create a fresh SVG before continuing
					this.$svg = SwcMC.UtilSVG.createElement('svg').attr({
						width: SVG_DEFAULT_WIDTH
					}).appendTo(this.$('.dmc-topology-svg'));
					this.$auxiliarySvg = SwcMC.UtilSVG.createElement('svg').attr({
						width: AUXILIARY_SVG_DEFAULT_WIDTH
					}).appendTo(this.$('.dmc-topology-auxiliaries-svg'));

					this._resizeMainBackground();
					this._resizeOtherBackground();

					this.children.indexerList.render().$el.appendTo(this.$svg);
					this.children.searchHeadList.render().$el.appendTo(this.$svg);
                	this.children.searchHeadToIndexerLinks.render().$el.appendTo(this.$svg);
                	this.children.auxiliaryList.render().$el.appendTo(this.$auxiliarySvg);

                	this.$el.show();
                }

				return this;
			},

			_renderTitles: function() {
				this._renderIndexerTitle();
				this._renderSearchHeadTitle();
				this._renderAuxiliaryTitle();
			},

			_renderIndexerTitle: function() {
				var indexerCount = this.collection.indexers.paging.get('total');
				this.$('.dmc-topology-indexers-title').text(
					INDEXERS_TITLE + (_.isNumber(indexerCount) ? ' (' + indexerCount + ')' : '')
				);
			},

			_renderSearchHeadTitle: function() {
				var searchHeadCount = this.collection.searchHeads.paging.get('total');
				this.$('.dmc-topology-search-heads-title').text(
					SEARCH_HEADS_TITLE + (_.isNumber(searchHeadCount) ? ' (' + searchHeadCount + ')' : '')
				);
			},

			_renderAuxiliaryTitle: function() {
				var auxiliaryCount = this.collection.auxiliaries.paging.get('total');
				this.$('.dmc-topology-auxiliaries-title').text(
					AUXILIARY_TITLE + (_.isNumber(auxiliaryCount) ? ' (' + auxiliaryCount + ')' : '')
				);
			},

			_updateIndexersTextFilter: function() {
				this._updateServerNameSearch(this.model.indexerFetchState, this.model.textFilter.get('indexers'));
			},

			_updateSearchHeadsTextFilter: function() {
				this._updateServerNameSearch(this.model.searchHeadFetchState, this.model.textFilter.get('searchHeads'));
			},

			_updateServerNameSearch: function(fetchState, serverName) {
				fetchState.set('serverNameSearch', 'serverName="' + serverName + '"');
			},

			_resizeMainBackground: _.debounce(function() {
				this._resizeSvg(
					this.$svg,
					[
						this.children.indexerList.getHeight(),
						this.children.searchHeadList.getHeight()
					],
					SVG_MIN_HEIGHT
				);
			}),

			_resizeOtherBackground: _.debounce(function() {
				this._resizeSvg(
					this.$auxiliarySvg,
					[this.children.auxiliaryList.getHeight()],
					AUXILIARY_SVG_MIN_HEIGHT
				);
			}),

			_resizeSvg: function($svg, heights, def) {
				var height = _.max(
						_.map(
							heights,
							function(height) {
								return this._bufferHeight(height);
							}, this
						).concat([def])
					);

				if ($svg) {
					$svg.attr('height', height);
				}
			},

			_bufferHeight: function(height) {
				return height + LIST_HEIGHT_BUFFER;
			},

			_resetIndexerRanges: function() {
				this._resetRanges(this.model.indexerFetchState);
			},

			_resetSearchHeadRanges: function() {
				this._resetRanges(this.model.searchHeadFetchState);
			},

			_resetAuxiliaryRanges: function() {
				this._resetRanges(this.model.auxiliaryFetchState);
			},

			_resetRanges: function(model) {
				model.set('ranges', '*');
			},

			template: Template
		});
	}
);
