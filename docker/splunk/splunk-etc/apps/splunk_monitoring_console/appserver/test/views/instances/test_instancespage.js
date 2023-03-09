define(
    [
        'backbone',
        '@splunk/swc-mc',
        '@splunk/swc-mc/dist/test-dependencies',
        'splunk_monitoring_console/views/instances/Master'
    ],
    function(
          Backbone,
          SwcMC,
          SwcMCTest,
          MasterView
        ) {
      var mockModel = {
        classicurlDfd: new Backbone.Model(),
        appLocal: new Backbone.Model(),
        application: new Backbone.Model(),
        earliestModel: new Backbone.Model(),
        latestModel: new Backbone.Model()
      };

      suite('Instances page', function() {
        setup(function() {
          // Mock XHR
          this.xhr = sinon.useFakeXMLHttpRequest();
          this.requests = [];
          this.xhr.onCreate = function(xhr) {
              this.requests.push(xhr);
          }.bind(this);

          SwcMCTest.MockCoreVisualizations.loadMockCoreVisualizations();
        });
        teardown(function() {
          delete this.masterView;
          this.xhr.restore();
          SwcMC.Mvc.Components.revokeInstance('groupDropdown');
          SwcMC.Mvc.Components.revokeInstance('smcGetGroups');
          SwcMC.Mvc.Components.revokeInstance('instanceSearchManager');
          SwcMC.Mvc.Components.revokeInstance('instancesTable');
          SwcMC.ClassicURLModel.off();
          SwcMC.ClassicURLModel.clear();
          SwcMCTest.MockCoreVisualizations.reset();
        });

        test('no url parameter', function() {
          this.masterView = new MasterView({
            model: mockModel
          });
          assert.equal(this.masterView.groupDropdownDefault, '*', 'this.groupDropdownDefault');

          SwcMC.ClassicURLModel.on('change', function() {
            if (SwcMC.ClassicURLModel.get('group') == undefined) { return; }
            assert.equal(SwcMC.ClassicURLModel.get('group'), this.masterView.groupDropdownView.val(), 'select an option: ' + JSON.stringify(SwcMC.ClassicURLModel.attributes));
            assert.equal(this.description, undefined, 'this.description');
          }.bind(this));
          this.masterView.groupDropdownView.val('dmc_group_indexer');
          this.masterView.groupDropdownView.val('dmc_search_head');
          this.masterView.groupDropdownView.val('dmc_customgroup_anewgroup');
          this.masterView.groupDropdownView.val('*');
        });

        test('Test only group parameter presents', function() {
          SwcMC.ClassicURLModel.set({
            group: 'dmc_group_indexer'
          });
          this.masterView = new MasterView({
            model: mockModel
          });
          assert.equal(this.masterView.groupDropdownDefault, 'dmc_group_indexer', 'this.groupDropdownDefault');

          SwcMC.ClassicURLModel.on('change', function() {
            if (SwcMC.ClassicURLModel.get('group') == undefined) { return; }
            assert.equal(SwcMC.ClassicURLModel.get('group'), this.masterView.groupDropdownView.val(), 'select an option: ' + JSON.stringify(SwcMC.ClassicURLModel.attributes));
            assert.equal(this.description, undefined, 'this.description');
          }.bind(this));
          this.masterView.groupDropdownView.val('dmc_group_indexer');
          this.masterView.groupDropdownView.val('dmc_search_head');
          this.masterView.groupDropdownView.val('dmc_customgroup_anewgroup');
          this.masterView.groupDropdownView.val('*');
        });

        test('Test only search parameters present', function() {
          SwcMC.ClassicURLModel.set({
            earliest: '500',
            latest: '0',
            search: 'index=_internal'
          });
          this.masterView = new MasterView({
            model: mockModel
          });
          assert.equal(this.masterView.groupDropdownDefault, '-----', 'this.groupDropdownDefault');

          SwcMC.ClassicURLModel.on('change', function() {
            if (SwcMC.ClassicURLModel.get('group') == undefined) { return; }
            assert.equal(SwcMC.ClassicURLModel.get('group'), this.masterView.groupDropdownView.val(), 'select an option: ' + JSON.stringify(SwcMC.ClassicURLModel.attributes));
            assert.equal(this.description, SwcMC.ClassicURLModel.get('description'), 'this.description');
          }.bind(this));
          this.masterView.groupDropdownView.val('dmc_group_indexer');
          this.masterView.groupDropdownView.val('dmc_search_head');
          this.masterView.groupDropdownView.val('dmc_customgroup_anewgroup');
          this.masterView.groupDropdownView.val('*');
        });

        test('Test both group and search parameters present', function() {
          SwcMC.ClassicURLModel.set({
            group: 'dmc_group_indexer',
            earliest: '500',
            latest: '0',
            search: 'index=_internal'
          });
          this.masterView = new MasterView({
            model: mockModel
          });
          assert.equal(this.masterView.groupDropdownDefault, 'dmc_group_indexer', 'this.groupDropdownDefault');
          SwcMC.ClassicURLModel.on('change', function() {
            if (SwcMC.ClassicURLModel.get('group') == undefined) { return; }
            assert.equal(SwcMC.ClassicURLModel.get('group'), this.masterView.groupDropdownView.val(), 'select an option: ' + JSON.stringify(SwcMC.ClassicURLModel.attributes));
            assert.equal(this.description, SwcMC.ClassicURLModel.get('description'), 'this.description');
          }.bind(this));
          this.masterView.groupDropdownView.val('dmc_group_indexer');
          this.masterView.groupDropdownView.val('dmc_search_head');
          this.masterView.groupDropdownView.val('dmc_customgroup_anewgroup');
          this.masterView.groupDropdownView.val('*');
        });

        test('Test user selection when no url parameter but has search parameter', function() {
          SwcMC.ClassicURLModel.set({
            earliest: '500',
            latest: '0',
            search: 'index=_internal'
          });
          this.masterView = new MasterView({model: mockModel});
          assert.equal(this.masterView.groupDropdownDefault, '-----', 'this.groupDropdownDefault before selecting');
          assert.equal(SwcMC.ClassicURLModel.get('group'), undefined, 'classicurl before selecting');
          assert.notEqual(SwcMC.ClassicURLModel.get('search'), undefined, 'classicurl before selecting');

          SwcMC.ClassicURLModel.on('change:group', function(val) {
            assert.equal(SwcMC.ClassicURLModel.get('group'), 'dmc_group_indexer', 'classicurl after selecting Indexer option');
            SwcMC.ClassicURLModel.off();
          });
          this.masterView.groupDropdownView.val('dmc_group_indexer');

          SwcMC.ClassicURLModel.on('change', function() {
            assert.equal(SwcMC.ClassicURLModel.get('group'), undefined, 'classicurl after selecting DRILLDOWN option');
            SwcMC.ClassicURLModel.off();
          })
          this.masterView.groupDropdownView.val('-----');

          SwcMC.ClassicURLModel.on('change:group', function() {
            assert.equal(SwcMC.ClassicURLModel.get('group'), 'dmc_group_search_head', 'classicurl after selecting Search Head option');
            SwcMC.ClassicURLModel.off();
          })
          this.masterView.groupDropdownView.val('dmc_group_search_head');

          SwcMC.ClassicURLModel.on('change:group', function() {
            assert.equal(SwcMC.ClassicURLModel.get('group'), '*', 'classicurl after selecting All option');
            SwcMC.ClassicURLModel.off();
          })
          this.masterView.groupDropdownView.val('*');
        });

        test('Test escape description function', function() {
          this.masterView = new MasterView({
            model: mockModel
          });

          assert.equal(this.masterView._escapeDescription("<img src=x onerror='alert(`${document.domain}:${document.cookie}`)'/>"),
            "&lt;img src=x onerror=&#39;alert(`${document.domain}:${document.cookie}`)&#39;/&gt;",
            'HTML escape description');
        });
      });
    }
);
