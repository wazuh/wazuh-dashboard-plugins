define([
  'splunk_monitoring_console/models/splunk_health_check/DmcConfigs',
  '@splunk/swc-mc'
], function(
  DmcConfigsModel,
  SwcMc
) {
  suite('DmcConfigsModel', function() {
    setup(function() {
      this.model = new DmcConfigsModel({}, {
        appLocal: new SwcMc.AppLocalModel(),
        serverInfo: new SwcMc.ServerInfoModel()
      });

      assert.ok(this.model, 'setup succeeded');
    });

    teardown(function() {
      this.model = null;

      assert.ok(true, 'teardown succeeded');
    });

    test('fetch', function() {
      sinon.stub(this.model.distsearchGroups, 'fetch');

      this.model.fetch();
      assert.ok(this.model.distsearchGroups.fetch.calledOnce, 'should call distsearchGroups.fetch once');
      assert.ok(this.model.distsearchGroups.fetch.firstCall.calledWithExactly(), 'should call distsearchGroups.fetch with no argument');
    });

    test('isDistributedMode', function() {
      this.model.appLocal.entry.content.set('configured', 0);

      assert.strictEqual(this.model.isDistributedMode(), false, 'should be standalone mode');

      this.model.appLocal.entry.content.set('configured', 1);

      assert.strictEqual(this.model.isDistributedMode(), true, 'should be distributed mode');
    });

    test('getDistsearchGroups', function() {
      assert.strictEqual(this.model.getDistsearchGroups(), this.model.distsearchGroups.models, 'should get distsearchGroups');
    });

    test('getLocalInstanceName', function() {
      var RANDOM_SERVER_NAME = 'random_server_name';
      sinon.stub(this.model.serverInfo, 'getServerName').returns(RANDOM_SERVER_NAME);

      assert.strictEqual(this.model.getLocalInstanceName(), RANDOM_SERVER_NAME, 'should get local server name');
    });
  });
});
