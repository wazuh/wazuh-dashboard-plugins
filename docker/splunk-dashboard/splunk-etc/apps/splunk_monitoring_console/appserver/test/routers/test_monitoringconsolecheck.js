define(
    [
        'splunk_monitoring_console/routers/MonitoringConsoleCheck',
    ],
    function (
        MonitoringConsoleCheck
    ) {
        suite('Setup', function() {
            setup(function() {
                this.xhr = sinon.useFakeXMLHttpRequest();
                this.requests = [];

                this.xhr.onCreate = function (xhr) {
                    this.requests.push(xhr);
                }.bind(this);

                this.monitoringConsoleCheck = new MonitoringConsoleCheck();
                assert.ok(this.monitoringConsoleCheck, 'We should get no exceptions');
            });

            teardown(function() {
                this.xhr.restore();
            });

            test('Test Init MonitoringConsoleCheck Router', function(){
                assert.ok(this.monitoringConsoleCheck, 'We should get no exceptions');
            });

            test('Test MonitoringConsoleCheck ParseUrl', function(){
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('tag'), '',
                    'Tag should be empty to start.');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('category'), '',
                    'Category should be empty to start.');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('group'), '*',
                    'Group should be * to start.');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('app'), '*',
                    'App should be * to start.');

                this.monitoringConsoleCheck.setConductor(
                    undefined, undefined, undefined, undefined);
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('tag'), '',
                    'Tag should still be empty.');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('category'), '',
                    'Category should still be empty.');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('group'), '*',
                    'Group should still be "*".');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('app'), '*',
                    'App should still be "*".');

                this.monitoringConsoleCheck.setConductor(
                    'pre_upgrade_check', 'Data Search', 'dmc_group_license_master');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('tag'), 'pre_upgrade_check',
                    'Tag should now be "pre_upgrade_check".');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('category'), 'Data Search',
                    'Category should now be "Data Search".');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('group'), 'dmc_group_license_master',
                    'Group should now be "dmc_group_license_master".');

                this.monitoringConsoleCheck.setConductor(
                    'pre_upgrade_check', ['Data Search', 'Splunk Miscellaneous'],
                    'dmc_group_indexer');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('tag'), 'pre_upgrade_check',
                    'Tag should now be "pre_upgrade_check".');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('category'), 'Data Search,Splunk Miscellaneous',
                    'Category should now be "Data Search,Splunk Miscellaneous".');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('group'), 'dmc_group_indexer',
                    'Group should now be "dmc_group_license_master".');

                this.monitoringConsoleCheck.setConductor(
                    ['bleargh', 'pre_upgrade_check'], 'Splunk Miscellaneous',
                    ['dmc_group_indexer', 'argle'], ['bargle']);
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('tag'), 'bleargh,pre_upgrade_check',
                    'Tag should now be "bleargh,pre_upgrade_check".');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('category'), 'Splunk Miscellaneous',
                    'Category should now be "Splunk Miscellaneous".');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('group'), '*',
                    'Group should now be "*".');
                assert.equal(this.monitoringConsoleCheck.model.conductor.get('app'), '*',
                    'App should now be "*".');
            });
        });
    }
);
