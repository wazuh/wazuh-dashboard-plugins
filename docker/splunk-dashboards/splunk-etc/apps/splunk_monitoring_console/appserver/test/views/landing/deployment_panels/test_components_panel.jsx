import React from 'react';
import { configure, shallow } from 'enzyme';
import ComponentsPanel from 'splunk_monitoring_console/views/landing/deploymentPanels/ComponentsPanel';
import EnzymeAdapterReact16 from 'enzyme-adapter-react-16';

suite('MC Deployment Components Panel Component', function () {
    setup(function () {
        configure({ adapter: new EnzymeAdapterReact16() });
        this.props = {
            features: [
                {
                    name: 'Data Forwarding',
                    health: 'red',
                },
                {
                    name: 'Indexer Clustering',
                    health: 'green',
                },
                {
                    name: 'Search Scheduler',
                    health: 'yellow',
                },
                {
                    name: 'File Monitor Input',
                    health: 'red',
                }
            ]
        };
        this.wrapper = shallow(<ComponentsPanel {...this.props} />);
        this.inst = this.wrapper.instance();

        assert.ok(this.wrapper, 'Wrapper instantiated successfully');
    });
    teardown(function () {
        this.wrapper = null;
        this.inst = null;
        assert.ok(true, 'Teardown was successful');
    });
    test('Test rendering the components panel', function () {
        assert.equal(
            this.wrapper.find('div[data-test-name="component-item"]').length,
            4, 'Correct number of component items rendered');
        assert.equal(
            this.wrapper.find('[data-test-name="success-icon"]').length,
            1, 'Correct number of green items');
        assert.equal(
            this.wrapper.find('[data-test-name="error-icon"]').length,
            2, 'Correct number of red items');
        assert.equal(
            this.wrapper.find('[data-test-name="warning-icon"]').length,
            1, 'Correct number of yellow items');
    });
});
