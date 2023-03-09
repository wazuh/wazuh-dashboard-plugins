define(
    [
        'module',
        'underscore',
        'jquery',
        'backbone',
        '@splunk/swc-mc',
        'splunk_monitoring_console/views/table/TableRow',
        'splunk_monitoring_console/views/table/MoreInfo',
        '@splunk/swc-mc',
        'splunk_monitoring_console/views/table/controls/EditAllMenu'
    ],
    function(
        module,
        _,
        $,
        Backbone,
        SwcMC,
        TableRowView,
        MoreInfoView,
        SwcMC,
        EditAllMenu
    ) {
        return SwcMC.BaseView.extend({
            moduleId: module.id,

            initialize: function() {
                SwcMC.BaseView.prototype.initialize.apply(this, arguments);

                this.collection = this.collection || {};
                this.collection.clientSidePeers = new Backbone.Collection();
                this.collection.clientSidePeers.paging = new Backbone.Model();
                this.children.tableRowToggle = new SwcMC.TableRowToggleView({el: this.el, collapseOthers: true });

                var columns = [
                        { label: _('i').t(), className: 'col-info', html: '<i class="icon-info"></i>'},
                        { label: '', className: 'col-select-all'},
                        { label: _('Instance (host)').t(), sortKey: 'host', className: 'col-name', tooltip: _('The "host" metadata field that an instance uses to tag the events it reads from data inputs. Set in inputs.conf / [default] / host.').t() },
                        { label: _('Instance (serverName)').t(), sortKey: 'peerName', className: 'col-serv-name', tooltip: _('The "splunk_server" internal field that an instance uses to tag the events it returns as search results. Set in server.conf / [general] / serverName.').t() },
                        { label: _('Machine').t(), sortKey: 'host_fqdn', className: 'col-mach-name', tooltip: _('The host name of the machine on which this Splunk Enterprise instance is running.').t() },
                        { label: _('Server roles').t(), className: 'col-server-roles' },
                        { label: _('Custom groups').t(), className: 'col-tags' },
                        { label: _('Indexer Cluster(s)').t(), className: 'col-indexer-cluster' },
                        { label: _('Search Head Cluster(s)').t(), className: 'col-searchhead-cluster' },
                        { label: _('Monitoring').t(), sortKey: 'status-toggle', className: 'col-status', tooltip: _('Only data from enabled and configured instances appears in DMC dashboards.').t() },
                        { label: _('State').t(), sortKey: 'state', className: 'col-state', tooltip: _('Only data from enabled and configured instances appears in DMC dashboards.').t() },
                        { label: _('Problems').t(), sortKey: 'problems', className: 'col-problems' },
                        { label: _('Actions').t(), className: 'col-actions' }
                    ],
                    localInstanceColumns = _.clone(columns),
                    selectAllRow = localInstanceColumns.splice(
                        localInstanceColumns.indexOf(
                            _.find(localInstanceColumns, function(column) {
                                return column.className === 'col-select-all';
                            })
                        ),
                        1
                    )[0];

                localInstanceColumns.splice(2, 0, selectAllRow);

                // In single instance mode, remove sortkeys and hide select-all box
                if (this.model.localInstance) {
                    columns = _.map(localInstanceColumns, function(column) {
                        var className = column.className;

                        if (className === 'col-name') {
                            className += ' col-name-no-border-right';
                        }

                        if (className !== 'col-select-all') {
                            return {
                                label: column.label,
                                className: className,
                                //sortKey: column.sortKey,
                                html: column.html
                            };
                        }
                        else {
                            return {
                                label: '',
                                className: 'hacky-col-width-adjustment',
                                html: ''
                            };
                        }
                    });
                }

                this.children.head = new SwcMC.TableHeadView({
                    model: this.model.state,
                    columns: columns,
                    checkboxClassName: 'col-select-all'
                });

                if (!this.model.localInstance) {
                    this.children.caption = new SwcMC.TableCaptionMasterView({
                        countLabel: _("Instances").t(),
                        model: {
                            state: this.model.state,
                            serverInfo: this.model.serverInfo,
                            rawSearch: this.model.state
                        },
                        collection: this.collection.clientSidePeers,
                        noFilterButtons: true,
                        filterKey: ['peerName']
                    });

                    this.children.count = new SwcMC.SyntheticSelectControlView({
                        modelAttribute: 'count',
                        model: this.model.state,
                        items: [
                            { value: 10,   label: _('10 Per Page').t()   },
                            { value: 25,   label: _('25 Per Page').t()   },
                            { value: 50,   label: _('50 Per Page').t()   },
                            { value: 100,  label: _('100 Per Page').t()  }
                        ],
                        save: false,
                        elastic: true,
                        menuWidth: "narrow",
                        toggleClassName: 'btn-pill',
                        popdownOptions: {attachDialogTo:'body'}
                    });

                    this.model.state.set('count', 25);
                }

                this.children.rows = this.rowsFromCollection();

                this.activate();

                this.listenTo(this.model.state, 'select-all-click', function() {
                    this.collection.peers.each(function(peer){
                        peer.trigger('select-all-click');
                    });
                });
                this.listenTo(this.model.state, 'deselect-all-click', function() {
                    this.collection.peers.each(function(peer){
                        peer.trigger('deselect-all-click');
                    });
                });
                this.listenTo(this.model.state, 'change:search', function () {
                    this.collection.peers.each(function(peer){
                        peer.trigger('deselect-all-click');
                    });
                });
                this.listenTo(this.model.state, 'change:count', this.renderRows);
            },

            events: {
              'click .edit-all' : function (e) {
                  e.preventDefault();
              },
              'mousedown .edit-all' : function (e) {
                  var $target = $(e.currentTarget);
                  if (this.children.editAllMenu && this.children.editAllMenu.shown) {
                      this.children.editAllMenu.hide();
                      e.preventDefault();
                      return;
                  }

                  this.children.editAllMenu = new EditAllMenu({
                      model: {
                          asset: this.model.asset,
                          state: this.model.state,
                          appLocal: this.model.appLocal
                      },
                      collection: {
                          peers: this.collection.peers,
                          clientSidePeers: this.collection.clientSidePeers
                      },
                      onHiddenRemove: true
                  });

                  $('body').append(this.children.editAllMenu.render().el);
                  this.children.editAllMenu.show($target);
              },
              'click .col-select-all': function(e) {
                  this.model.state.get('selectAll') ? this.model.state.trigger('select-all-click') : this.model.state.trigger('deselect-all-click');
              }
            },

            startListening: function () {
                this.model.state.on('updateRows', _.debounce(this.renderRows), this);
                if (this.model.localInstance) {
                    this.model.localInstance.on('sync', _.debounce(this.renderRows), this);
                } else {
                    this.collection.peers.on('sync', _.debounce(this.renderRows), this);
                    this.model.state.on(
                        'change:sortKey change:sortDirection change:offset change:search',
                        _.debounce(this.renderRows),
                        this
                    );
                }
            },
            rowsFromCollection: function() {
                if (this.model.localInstance) {
                    return [
                        new TableRowView({
                            model: {
                                appLocal: this.model.appLocal,
                                application: this.model.application,
                                peer: this.model.localInstance,
                                state: this.model.state
                            },
                            collection: {
                                peers: this.collection.peers
                            },
                            index: 0,
                            isLocal: true
                        }),
                        new MoreInfoView({
                            model: {
                                peer: this.model.localInstance
                            },
                            index: 0
                        })
                    ];
                }

                var peers = this.collection.peers;
                // Sort properly
                peers = peers.sortBy(function(peer) {
                    var sortKey = this.model.state.get('sortKey');
                    var value = null;
                    if (sortKey === 'name') {
                        value = peer.entry.get('name');
                    } else if (sortKey === 'state') {
                        var state = peer.entry.content.get('state');
                        if(state === "Configured") {
                            return "1";
                        } else if (state === "New") {
                            return "2";
                        } else {
                            return "-1";
                        }
                    } else if (sortKey === 'status-toggle') {
                        var toggle = peer.entry.content.get('status-toggle');
                        if(toggle === "Enabled") {
                            return "1";
                        } else if (toggle === "Disabled") {
                            return "2";
                        } else {
                            return "-1";
                        }
                    } else if (sortKey === 'problems') {
                        if(peer.entry.content.get('errorMessages').length > 0) {
                            return "1";
                        } else if (peer.entry.content.get('warningMessages').length > 0) {
                            return "2";
                        } else {
                            return "-1";
                        }
                    } else {
                        value = peer.entry.content.get(sortKey);
                    }

                    return value;
                }, this);

                if (this.model.state.get('sortDirection') !== 'asc') {
                    peers = peers.reverse();
                }

                var extractValue = function(string) {
                    var s = string.split('=')[1];
                    return s.replace(/[\"|\'|\s]/g, "");
                };

                if (this.model.state.get('search')) {
                    peers = peers.filter(function(peer) {
                        // function in the DistributedSearchGroup mixin

                        if(peer.containsRole(this.model.state.get('rawSearch'))) {
                            return true;
                        }

                        var searchables = [
                            peer.entry.content.get('peerName'),
                            peer.entry.content.get('host'),
                            peer.entry.content.get('host_fqdn'),
                            peer.entry.content.get('state'),
                            peer.entry.content.get('status-toggle'),
                            peer.entry.content.get('indexerClusters'),
                            peer.entry.content.get('searchHeadClusters')
                        ];
                        return _.reduce(searchables, function(memo, searchable) {
                            var search = this.model.state.get('rawSearch').toLowerCase();

                            if (_.isArray(searchable)) {
                                return memo || !!_.find(searchable, function(item) {
                                    return item.toLowerCase().indexOf(search) !== -1;
                                });
                            } else {
                                return memo || (searchable.toLowerCase()).indexOf(search) !== -1;
                            }
                        }, false, this);
                    }, this);
                }

                var totalPeers = peers.length || 0;

                // Client side pagination, if necessary:
                if (this.model.state.get('count') > 0 &&
                    this.model.state.get('count') < this.collection.peers.length) {

                    peers = peers.slice(
                        this.model.state.get('offset'),
                        this.model.state.get('offset') + this.model.state.get('count')
                    );
                }

                this.collection.clientSidePeers.paging.set('total', totalPeers);
                this.collection.clientSidePeers.reset(peers);

                return _.flatten(
                    peers.map(function(model, i) {
                        return [
                            new TableRowView({
                                model: {
                                    appLocal: this.model.appLocal,
                                    application: this.model.application,
                                    peer: model,
                                    state: this.model.state
                                },
                                collection: {
                                    peers: this.collection.peers
                                },
                                index: i
                            }),
                            new MoreInfoView({
                                model: {
                                    peer: model
                                },
                                index: i
                            })
                        ];
                    }, this)
                );
            },
            _render: function() {
                _(this.children.rows).each(function(row){
                    row.render().appendTo(this.$('.managementconsole-listings'));
                }, this);
            },
            renderRows: function() {
                 _(this.children.rows).each(function(row){ row.remove(); }, this);
                 this.children.rows = this.rowsFromCollection();
                 this._render();
            },
            render: function() {

                if (!this.el.innerHTML) {
                    if (this.children.caption) {
                        this.$el.append(this.children.caption.render().el);
                    }
                    this.$el.append(this.compiledTemplate({
                        _:_,
                        isLocal: this.model.localInstance
                    }));
                    this.children.head.render().prependTo(this.$('> .table-chrome'));
                    if (this.children.caption) {
                        this.$('.edit-div').append(this.children.count.render().$el);
                    }
                }

                this._render();

                return this;
            },

            template: '\
                <% if (!isLocal) { %>\
                    <div class="table-caption edit-div">\
                        <h3>\
                            <a class="dropdown-toggle edit-all" href="#"><%- _("Edit Selected Instances").t() %>\
                                <span class="caret"></span>\
                            </a>\
                        </h3>\
                    </div>\
                <% } %>\
                <table class="table table-chrome table-striped table-row-expanding table-listing">\
                    <tbody class="managementconsole-listings"></tbody>\
                </table>\
            '
        });
    }
);
