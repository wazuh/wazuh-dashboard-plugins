import React from 'react';
import { configure, shallow } from 'enzyme';
import BookmarkModal from 'splunk_monitoring_console/views/landing/bookmark/BookmarkModal';
import EnzymeAdapterReact16 from 'enzyme-adapter-react-16';

suite('MC Bookmark Modal Component', function() {
    setup(function () {
        configure({ adapter: new EnzymeAdapterReact16() });
        this.handleModalClose = sinon.spy();
        this.props = {
            bookmarks: {
                fetch: () => {},
                models: [],
                on: () => {},
                getBookmarks: () => { return [] },
            },
            handleClose: this.handleModalClose,
        };
        this.wrapper = shallow(<BookmarkModal {...this.props} />);
        this.inst = this.wrapper.instance();

        assert.ok(this.wrapper, 'Wrapper instantiated successfully');
    });
    teardown(function () {
        this.wrapper = null;
        this.inst = null;
        assert.ok(true, 'Teardown was successful');
    });
    test('Test rendering the bookmark modal', function() {
        assert.equal(
            this.wrapper.find('[data-test-name="bookmark-modal"]').length,
            1, 'Bookmark modal is rendered');
        assert.equal(this.wrapper.find('[data-test="BookmarkLabel"]').length,
            1, 'Label control group should appear');
        assert.equal(this.wrapper.find('[data-test="BookmarkURL"]').length,
            1, 'URl control group should appear');
        assert.equal(this.wrapper.find('[data-test-name="cancel-button"]').length,
            1, 'Cancel button should appear');
        assert.equal(this.wrapper.find('[data-test-name="save-button"]').length,
            1, 'Save button should appear');
    });
    test('Test handleClose nothing changed', function() {
        this.inst.state.open = true;
        assert.equal(this.inst.state.open, true,
            'open is set to true');
        this.inst.state.isWorking = true;
        assert.equal(this.inst.state.isWorking, true,
            'isWorking is set to true');
        this.inst.state.label = 'prod37';
        assert.equal(this.inst.state.label, 'prod37',
            'label set to "prod37"');
        this.inst.state.url = 'http://splunk_monitoring_console';
        assert.equal(this.inst.state.url, 'http://splunk_monitoring_console',
            'url set to "http://splunk_monitoring_console"');
        this.inst.state.labelErrorMsg = 'argle bargle1';
        assert.equal(this.inst.state.labelErrorMsg, 'argle bargle1',
            'labelErrorMsg is set to "argle bargle1"');
        this.inst.state.labelError = true;
        assert.equal(this.inst.state.labelError, true,
            'labelError is set to true');
        this.inst.state.urlErrorMsg = 'argle bargle2';
        assert.equal(this.inst.state.urlErrorMsg, 'argle bargle2',
            'urlErrorMsg is set to "argle bargle2"');
        this.inst.state.urlError = true;
        assert.equal(this.inst.state.urlError, true,
            'urlError is set to true');
        this.inst.state.backendErrorMsg = 'argle bargle3';
        assert.equal(this.inst.state.backendErrorMsg, 'argle bargle3',
            'backendErrorMsg is set to "argle bargle3"');
        this.inst.state.backendError = true;
        assert.equal(this.inst.state.backendError, true,
            'backendError is set to true');

        this.inst.handleClose();
        assert.equal(this.inst.state.open, false,
            'open should be false');
        assert.equal(this.inst.state.isWorking, false,
            'isWorking should be false');
        assert.equal(this.inst.state.label, '',
            'label should be empty');
        assert.equal(this.inst.state.url, '',
            'url should be empty');
        assert.equal(this.inst.state.labelErrorMsg, '',
            'labelErrorMsg should be empty');
        assert.equal(this.inst.state.labelError, false,
            'lableError should be false');
        assert.equal(this.inst.state.urlErrorMsg, '',
            'urlRrrorMsg should be empty');
        assert.equal(this.inst.state.urlError, false,
            'urlError should be false');
        assert.equal(this.inst.state.backendErrorMsg, '',
            'backendErrorMsg should be empty');
        assert.equal(this.inst.state.backendError, false,
            'backendError should be false');
        assert.equal(this.handleModalClose.calledOnce, false,
            "handleModalClose should not be called");
    });
    test('Test handleClose with changed', function() {
        this.inst.state.open = true;
        assert.equal(this.inst.state.open, true,
            'open is set to true');
        this.inst.state.isWorking = true;
        assert.equal(this.inst.state.isWorking, true,
            'isWorking is set to true');
        this.inst.state.label = 'prod37';
        assert.equal(this.inst.state.label, 'prod37',
            'label set to "prod37"');
        this.inst.state.url = 'http://splunk_monitoring_console';
        assert.equal(this.inst.state.url, 'http://splunk_monitoring_console',
            'url set to "http://splunk_monitoring_console"');
        this.inst.state.labelErrorMsg = 'argle bargle1';
        assert.equal(this.inst.state.labelErrorMsg, 'argle bargle1',
            'labelErrorMsg is set to "argle bargle1"');
        this.inst.state.labelError = true;
        assert.equal(this.inst.state.labelError, true,
            'labelError is set to true');
        this.inst.state.urlErrorMsg = 'argle bargle2';
        assert.equal(this.inst.state.urlErrorMsg, 'argle bargle2',
            'urlErrorMsg is set to "argle bargle2"');
        this.inst.state.urlError = true;
        assert.equal(this.inst.state.urlError, true,
            'urlError is set to true');
        this.inst.state.backendErrorMsg = 'argle bargle3';
        assert.equal(this.inst.state.backendErrorMsg, 'argle bargle3',
            'backendErrorMsg is set to "argle bargle3"');
        this.inst.state.backendError = true;
        assert.equal(this.inst.state.backendError, true,
            'backendError is set to true');
        this.inst.state.changed = true;

        this.inst.handleClose();
        assert.equal(this.inst.state.open, false,
            'open should be false');
        assert.equal(this.inst.state.isWorking, false,
            'isWorking should be false');
        assert.equal(this.inst.state.label, '',
            'label should be empty');
        assert.equal(this.inst.state.url, '',
            'url should be empty');
        assert.equal(this.inst.state.labelErrorMsg, '',
            'labelErrorMsg should be empty');
        assert.equal(this.inst.state.labelError, false,
            'lableError should be false');
        assert.equal(this.inst.state.urlErrorMsg, '',
            'urlRrrorMsg should be empty');
        assert.equal(this.inst.state.urlError, false,
            'urlError should be false');
        assert.equal(this.inst.state.backendErrorMsg, '',
            'backendErrorMsg should be empty');
        assert.equal(this.inst.state.backendError, false,
            'backendError should be false');
        assert.equal(this.handleModalClose.calledOnce, true,
            "handleModalClose should be called once");
    });
    test('Test handleOpen', function() {
        assert.equal(this.inst.state.open, false,
            'modal should not yet be open');
        this.inst.handleOpen();
        assert.equal(this.inst.state.open, true,
            'modal should be open now');
    });
    test('test handleTextChange', function() {
        assert.equal(this.inst.state.url, '',
            'Url should be empty');
        this.inst.handleTextChange(null, { name: 'url', value: 'bleargh'});
        assert.equal(this.inst.state.url, 'bleargh',
            'Url should be "bleargh"');
        this.inst.handleTextChange(null, { name: 'url', value: 'argle'});
        assert.equal(this.inst.state.url, 'argle',
            'Url should be "argle"');
    });
    test('Test handleSubmit no errors', function() {
        this.inst.state.label = 'niceLabel';
        this.inst.state.url = 'http://splunk_monitoring_console';
        this.inst.saveBookmark = sinon.spy();
        this.inst.handleSubmit();
        assert.equal(this.inst.state.labelError, false,
            'Should not have a label error');
        assert.equal(this.inst.state.urlError, false,
            'Should not have a url error');
        assert.equal(this.inst.saveBookmark.calledOnce, true,
            'saveBookmark should be called once');
    });
    test('Test handleSubmit with errors', function() {
        this.inst.state.label = 'toooooooooooo_loooooooooooooooo_label';
        this.inst.state.url = 'http://asdfagsdfgasdf';
        this.inst.saveBookmark = sinon.spy();
        this.inst.handleSubmit();
        assert.equal(this.inst.state.labelError, true,
            'Should have a label error');
        assert.equal(this.inst.state.urlError, true,
            'Should have a url error');
        assert.equal(this.inst.saveBookmark.calledOnce, false,
            'saveBookmark should be called once');
    });
});
