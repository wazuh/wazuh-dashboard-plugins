define(
    [
        'underscore',
        'backbone',
        'module',
        '@splunk/swc-mc'
    ],
    function(
        _,
        Backbone,
    	module,
        SwcMC
    )
    {
    	return SwcMC.BaseView.extend({
    		moduleId: module.id,
    		tagName: 'tr',
    		className: 'more-info',

    		initialize: function() {
    			SwcMC.BaseView.prototype.initialize.apply(this, arguments);
    			this.$el.addClass((this.options.index % 2) ? 'odd' : 'even').css('display', 'none');

                this.collection = this.collection || new Backbone.Collection();
                this.collection.errorsCollection = new SwcMC.FlashMessagesCollection(); 
                this.collection.warningsCollection = new SwcMC.FlashMessagesCollection();

                this.children.errorMessages = new SwcMC.FlashMessagesLegacyView({
                    collection: this.collection.errorsCollection,
                    escape: false
                });

                this.children.warningMessages = new SwcMC.FlashMessagesLegacyView({
                    collection: this.collection.warningsCollection,
                    escape: false
                });

                var errorMessages = _.uniq(this.model.peer.entry.content.get("errorMessages"));
                if (errorMessages.length > 0) {
                    this.collection.errorsCollection.reset(_.map(errorMessages, function(message) {
                        return {
                            type: 'error',
                            html: message
                        };
                    }));
                }

                var warningMessages = _.uniq(this.model.peer.entry.content.get("warningMessages"));
                if (warningMessages.length > 0) {
                    this.collection.warningsCollection.reset(_.map(warningMessages, function(message) {
                        return {
                            type: 'warning',
                            html: message
                        };
                    }));
                }
                this.activate();
    		},       

            _hasProblem: function() {
                return this.model.peer.entry.content.get("errorMessages").length > 0 || this.model.peer.entry.content.get("warningMessages").length > 0;
            },

            render: function() {
                var root = (SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH.indexOf("/") === 0 ?
                    SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH.substring(1) :
                    SwcMC.SplunkConfig.MRSPARKLE_ROOT_PATH
                );

                var peer_uri = this.model.peer.entry.get("name") || _("N/A").t();
                var os_name = this.model.peer.entry.content.get("os_name") ? (this.model.peer.entry.content.get("os_name")) : _("N/A").t();
                var number_of_cores = this.model.peer.entry.content.get("numberOfCores") || _("N/A").t();
                var physical_memory_mb = this.model.peer.entry.content.get("physicalMemoryMB") ? (this.model.peer.entry.content.get("physicalMemoryMB") + "MB") : _("N/A").t();
                var version = this.model.peer.entry.content.get("version") || _("N/A").t();

                this.$el.html(this.compiledTemplate({
                    peer: this.model.peer,
                    os_name: os_name,
                    number_of_cores: number_of_cores,
                    physical_memory_mb: physical_memory_mb,
                    version: version
                }));


                if(this._hasProblem()) {
                    this.$('td.details').prepend("<p class='message-generic-warning-learn-more'>"+ _("Resolve these problems to ensure that your dashboards are complete.").t() + " <a style='font-weight:bold;' href='"+SwcMC.URIRoute.docHelp(root, SwcMC.SplunkConfig.LOCALE, "app.splunk_monitoring_console.warnings")+"'' target='_blank' class='external'>" + _("Learn more").t() + "</a></p>");
                }

                this.$('td.details').prepend(this.children.warningMessages.render().el);
                this.$('td.details').prepend(this.children.errorMessages.render().el);

                return this;
            },
            template: '\
                <td class="details" colspan="12">\
                    <dl class="list-dotted">\
                        <dt class="peer_uri"><%- _("Peer URI").t() %></dt>\
                            <dd class="peer_uri"><%- peer.entry.get("name") || _("N/A").t() %></dd>\
                        <dt class="os_name"><%- _("OS").t() %></dt>\
                            <dd class="os_name"><%- os_name %></dd>\
                        <dt class="numberOfCores"><%- _("Cores").t() %></dt>\
                            <dd class="numberOfCores"><%- number_of_cores %></dd>\
                        <dt class="physicalMemoryMB"><%- _("RAM").t() %></dt>\
                            <dd class="physicalMemoryMB"><%- physical_memory_mb %></dd>\
                        <dt class="version"><%- _("Version").t() %></dt>\
                            <dd class="version"><%- version %></dd>\
                    </dl>\
                </td>\
            '
    	});
    }
);