define(['jquery', 'underscore', 'module', '@splunk/swc-mc'], function ($, _, module, SwcMC) {
    var MESSAGES = {
        PROGRESS: _('in progress').t(),
        CANCEL: _('cancelled').t(),
        DONE: _('done').t(),
        ERROR: _('error').t(),
        FAILED: _('failed').t(),
        START: _('start').t(),
    };

    var CONTINUE_BUTTON =
        '<a href="#" class="btn btn-primary modal-btn-primary build-now-button">' + _('Continue').t() + '</a>';
    var RUN_AGAIN_BUTTON =
        '<a href="#" class="btn btn-primary modal-btn-primary run-again-button">' + _('Run Again').t() + '</a>';
    var DO_IT_LATER_BUTTON =
        '<a href="#" class="btn modal-btn-cancel cancel" data-dismiss="modal">' + _('Later').t() + '</a>';
    var EXPLANATION_TXT = _(
        'Forwarder monitoring is active. Do you want to rebuild forwarder assets now? This operation can take time and increase the search workload on your indexers. Click "Later" to run the rebuild at the next scheduled search time.'
    ).t();

    return SwcMC.ModalView.extend({
        moduleId: module.id,
        initialize: function () {
            SwcMC.ModalView.prototype.initialize.apply(this, arguments);

            this.compiledProgressBar = _.template(this._progressBarTemplate);
        },
        events: $.extend({}, SwcMC.ModalView.prototype.events, {
            'click .build-now-button': function (e) {
                e.preventDefault();
                this._buildAssets();
            },
        }),
        _buildAssets: function () {
            if (!this.searchManager) {
                this.searchManager = new SwcMC.SavedSearchManager({
                    searchname: 'DMC Forwarder - Build Asset Table',
                });
                this.searchManager.on(
                    {
                        'search:cancelled': function () {
                            this._updateSearchStatus(MESSAGES.CANCEL);
                        },
                        'search:done': function () {
                            this._updateSearchStatus(MESSAGES.DONE);
                        },
                        'search:error': function () {
                            this._updateSearchStatus(MESSAGES.ERROR);
                        },
                        'search:failed': function () {
                            this._updateSearchStatus(MESSAGES.FAILED);
                        },
                        'search:progress': function () {
                            this._updateSearchStatus(MESSAGES.PROGRESS);
                        },
                        'search:start': function () {
                            this._updateSearchStatus(MESSAGES.START);
                        },
                    },
                    this
                );
            } else {
                this.searchManager.startSearch();
            }
        },
        _updateSearchStatus: function (message) {
            var $progressBar = this.$(SwcMC.ModalView.BODY_SELECTOR).find('.progress-bar');
            if ($progressBar.length <= 0) {
                // no progress bar
                this.$(SwcMC.ModalView.BODY_SELECTOR).html(
                    this.compiledProgressBar({
                        message: message,
                    })
                );
            } else {
                $progressBar.html(message);
            }
            this.$(SwcMC.ModalView.FOOTER_SELECTOR).empty();
            if (_.contains([MESSAGES.CANCEL, MESSAGES.ERROR, MESSAGES.FAILED], message)) {
                this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(RUN_AGAIN_BUTTON);
            } else if (MESSAGES.DONE === message) {
                $progressBar.removeClass('progress-striped active');
                this.$(SwcMC.ModalView.FOOTER_SELECTOR).html(SwcMC.ModalView.BUTTON_DONE);
                this.$(SwcMC.ModalView.FOOTER_SELECTOR).find('.btn-primary').focus();
            }
        },
        render: function () {
            this.$el.html(SwcMC.ModalView.TEMPLATE);
            this.$(SwcMC.ModalView.HEADER_TITLE_SELECTOR).html(_('Build Forwarder Assets Now').t());
            this.$(SwcMC.ModalView.BODY_SELECTOR).html(EXPLANATION_TXT);
            this.$(SwcMC.ModalView.FOOTER_SELECTOR).append(CONTINUE_BUTTON);
            this.$(SwcMC.ModalView.FOOTER_SELECTOR).prepend(DO_IT_LATER_BUTTON);

            return this;
        },
        _progressBarTemplate:
            '<div class="progress"><div class="progress-bar progress-striped active" style="width: 100%"><%= message %></div></div>',
    });
});
