define(
[
    '@splunk/swc-mc/dist/test-dependencies',
    'splunk_monitoring_console/views/settings/forwarder_setup/enterprise/Master'
], function(
    SwcMcTest,
    MasterView
) {
    suite('Master View:', function() {
        setup(function() {
            this.masterView = new MasterView({
                model: {
                    application: new SwcMcTest.MockSplunkDModel(),
                    savedSearch: new SwcMcTest.MockSplunkDModel()
                }
            });
            this.masterView.render();
            sinon.spy(this.masterView, '_updateFormStyle');
            sinon.spy(this.masterView.children.buildAssetsNowDialog, 'show');
            sinon.spy(this.masterView.children.rebuildAssetsDialog, 'show');
            sinon.spy(this.masterView.children.dataCollectionInterval, 'enable');
            sinon.spy(this.masterView.children.dataCollectionInterval, 'disable');
            assert.ok(true, 'Master View created');
        });

        teardown(function() {

        });

        test('test save', function() {
            this.masterView._saveForwarderSetup();
            assert.ok(this.masterView._saveButtonClicked, 'save button should be clicked');
            assert.equal(this.masterView.model.savedSearch.save.callCount, 1, 'model should be saved');
        });

        test('rebuild dialog', function() {
            this.masterView._rebuildForwarderAsset();
            assert.equal(this.masterView.children.rebuildAssetsDialog.show.callCount, 1, 'rebuild dialog show');
        });

        test('style update', function() {
            this.masterView._restoreForwarderSetup();
            assert.equal(this.masterView.model.savedSearch.fetch.callCount, 1, 'fetch should be called once');
        });

        test('form style enabled', function() {
            this.masterView.model.savedSearch.entry.content.set({'disabled': false}, {silent: true});
            this.masterView._updateFormStyle();
            assert.equal(this.masterView.children.dataCollectionInterval.enable.callCount, 1, 'data collection interval enabled');
        });

        test('form style disabled', function() {
            this.masterView.model.savedSearch.entry.content.set({'disabled': true}, {silent: true});
            this.masterView._updateFormStyle();
            assert.equal(this.masterView.children.dataCollectionInterval.disable.callCount, 1, 'data collection interval disabled');
        });

        test('render', function() {
            this.masterView.render();
            assert.ok(this.masterView.children.toggleSavedSearch, 'toggleSavedSearch should exists');
            assert.ok(this.masterView.children.dataCollectionInterval, 'dataCollectionInterval should exists');
            assert.ok(this.masterView.children.rebuildAssetsDialog, 'rebuildAssetsDialog should exists');
            assert.ok(this.masterView.children.buildAssetsNowDialog, 'buildAssetsNowDialog should exists');
            assert.equal(this.masterView._updateFormStyle.callCount, 1, 'form style should be updated');
        });
    });
})
