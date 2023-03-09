define(
[
    'splunk_monitoring_console/views/settings/forwarder_setup/enterprise/BuildAssetsNowDialog'
], function(
    BuildAssetsNowDialog
) {
    suite('Build Assets Now', function() {
        setup(function() {
            this.view = new BuildAssetsNowDialog();

            assert.ok(this.view, 'dialog created');
        });

        teardown(function() {

        });

        test('search manager', function() {
            this.view._buildAssets();
            assert.ok(this.view.searchManager, 'search manager should have been created');
        });

        test('render', function() {
            this.view.render();
            
            assert.ok(this.view.$el[0].children.length > 0, 'DOM should have been created');
        });
    });
});