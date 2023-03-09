import React from 'react';
import { configure, shallow } from 'enzyme';
import BookmarkPanel from 'splunk_monitoring_console/views/landing/bookmark/Bookmark';
import EnzymeAdapterReact16 from 'enzyme-adapter-react-16';

suite('MC Bookmark Component', function () {
    setup(function () {
        configure({ adapter: new EnzymeAdapterReact16() });
        this.fakeBookmarks = [
            {
                'id': 'prod1',
                'label': 'prod1',
                'url': 'http://splunk_monitoring_console',
            },
            {
                'id': 'dev2',
                'label': 'dev2',
                'url': 'http://splunk_monitoring_console-dev',
            },
        ];
        this.props = {
            bookmarks: {
                fetch: () => {},
                models: [],
                on: () => {},
                getBookmarks: () => { return this.fakeBookmarks },
            },
        };
        this.wrapper = shallow(<BookmarkPanel {...this.props} />);
        this.inst = this.wrapper.instance();

        assert.ok(this.wrapper, 'Wrapper instantiated successfully');
    });
    teardown(function () {
        this.wrapper = null;
        this.inst = null;
        this.fakeMetrics = {};
        assert.ok(true, 'Teardown was successful');
    });
    test('Test handleModalClose', function() {
        this.inst.updateBookmarks = sinon.spy();
        this.inst.handleModalClose();
        assert.ok(this.inst.updateBookmarks.calledOnce,
            'updateBookmarks should be called once');
    });
    test('Test updateBookmarks', function() {
        assert.equal(Object.keys(this.inst.state.bookmarks).length, 2,
            'Should be 2 bookmarks initially');
        this.fakeBookmarks.push({
            'id': 'prod3',
            'label': 'prod3',
            'url': 'http://splunk_monitoring_console-prod3',
        });
        this.inst.updateBookmarks();
        assert.equal(Object.keys(this.inst.state.bookmarks).length, 3,
            'Should now be 3 bookmarks');
    });
});
