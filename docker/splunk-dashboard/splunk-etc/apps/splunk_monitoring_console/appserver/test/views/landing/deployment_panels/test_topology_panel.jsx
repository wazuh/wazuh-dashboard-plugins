import React from 'react';
import { configure, shallow } from 'enzyme';
import { AppLocalModel, ClusterConfigModel } from '@splunk/swc-mc';
import TopologyPanel from 'splunk_monitoring_console/views/landing/deploymentPanels/TopologyPanel';
import EnzymeAdapterReact16 from 'enzyme-adapter-react-16';

suite('MC Deployment Topology Panel Component', function () {
    setup(function () {
        configure({ adapter: new EnzymeAdapterReact16() });

        // Mock XHR
        this.xhr = sinon.useFakeXMLHttpRequest();
        this.requests = [];
        this.xhr.onCreate = function(xhr) {
            this.requests.push(xhr);
        }.bind(this);

        this.props = {
            appLocal: new AppLocalModel({
                configured: 0,
            }),
            indexes: 11,
            indexerClustering: new ClusterConfigModel({
                changed: {
                    disabled: false,
                    replication_factor: 1,
                    search_factor: 3,
                },
            }),
        };
        this.wrapper = shallow(<TopologyPanel {...this.props} />);
        this.inst = this.wrapper.instance();

        assert.ok(this.wrapper, 'Wrapper instantiated successfully');
    });
    teardown(function () {
        this.xhr.restore();
        this.wrapper = null;
        this.inst = null;
        assert.ok(true, 'Teardown was successful');
    });
    test('Test rendering the topoloy panel', function () {
        assert.equal(
            this.wrapper.find('div[data-test-name="deployment-topology-card"]').length,
            1, 'One TopologyPanel deployment-topology-card rendered');
        assert.equal(
            this.wrapper.find('div[className="topologyMiniCard"]').length,
            2, 'Two TopologyPanel topologyMiniCard rendered');
        assert.equal(
            this.wrapper.find('div[className="topologyRow"]').length,
            3, 'Three TopologyPanel topologyRow rendered');
    });
});
