import * as Utils from 'splunk_monitoring_console/views/landing/bookmark/Utils';

suite('Bookmark Utils', function() {
    test('test bookmark constants', function() {
        assert.equal(Utils.URL_MISSING_MC_MESSAGE, 
            'URL must contain splunk_monitoring_console.');
        assert.equal(Utils.URL_BLANK_MESSAGE, 
            'URL must be entered.');
        assert.equal(Utils.URL_NOT_ABSOLUTE_MESSAGE, 
            'URL must be absolute.');
        assert.equal(Utils.LABEL_BLANK_MESSAGE, 
            'Label must be entered.');
        assert.equal(Utils.LABEL_TOO_LONG_MESSAGE, 
            'Label can only be 25 characters long.');
    });
    test('test validateUrl', function() {
        assert.equal(Utils.validateUrl('http://splunk_monitoring_console'), '',
            'Valid url returns no warning message');
        assert.equal(Utils.validateUrl(''),
            Utils.URL_BLANK_MESSAGE,
            'Blank url returns correct warning message');
        assert.equal(Utils.validateUrl('http://argle'),
            Utils.URL_MISSING_MC_MESSAGE,
            'Missing MC url returns correct warning message');
        assert.equal(Utils.validateUrl('splunk_monitoring_console'),
            Utils.URL_NOT_ABSOLUTE_MESSAGE,
            'Non-absolute url returns correct warning message');
    });
    test('test validateLabel', function() {
        const labels = ['prod1', 'prod2', 'prod3'];
        assert.equal(Utils.validateLabel('best label ever', labels, true), '',
            'Valid label returns no warning message');
        assert.equal(Utils.validateLabel('', labels, true),
            Utils.LABEL_BLANK_MESSAGE,
            'Blank label returns correct warning message');
        assert.equal(
            Utils.validateLabel('loooooooooooooooooooooooooooooooooooooooong label', labels),
            Utils.LABEL_TOO_LONG_MESSAGE,
            'Too long label returns correct warning message');
        assert.equal(Utils.validateLabel('prod2', labels, true),
            'Label already in use.',
            'Already in use label returns correct warning message');
        assert.equal(Utils.validateLabel('prod2', labels, false),
            '',
            'Already in use label returns no warning message if not checking for that');
    });
    test('test getValidBookmarks', function() {
        const bookmarks = [
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
        assert.equal(Utils.getValidBookmarks(bookmarks).length, 2,
            'Should have 2 valid bookmarks');
        bookmarks.push({
            'id': 'prod3',
            'label': 'prod3',
            'url': 'http://splunk_monitoring_console-prod3',
        });
        assert.equal(Utils.getValidBookmarks(bookmarks).length, 3,
            'Should have 3 valid bookmarks');
        bookmarks.push({
            'id': 'bad',
            'label': 'bad',
            'url': 'http://bad.com',
        });
        assert.equal(Utils.getValidBookmarks(bookmarks).length, 3,
            'Should still have 3 valid bookmarks, not bookmark with bad url');
        bookmarks.push({
            'id': '',
            'label': '',
            'url': 'http://splunk_monitoring_console-blank',
        });
        assert.equal(Utils.getValidBookmarks(bookmarks).length, 3,
            'Should only have 3 valid bookmarks, not bookmark with empty label');
    });
});
