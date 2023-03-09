var assert = require('chai').assert;

var mergeConfigs = require('./mergeConfigs');

describe('mergeConfigs', function() {
    it('should merge two flat objects, latter keys overriding previous ones', function() {
        var result = mergeConfigs({
            a: 'a',
            b: 'should be overridden'
        }, {
            b: 'correct',
            c: 'c'
        });

        assert.deepEqual(result, {
            a: 'a',
            b: 'correct',
            c: 'c'
        });
    });

    it('should concat arrays', function() {
        var result = mergeConfigs({
            arr: [1, 2]
        }, {
            arr: [3, 4]
        });

        assert.deepEqual(result, {
            arr: [3, 4, 1, 2]
        });
    });

    it('should override if one config has an array, but the other doesn\'t', function() {
        var result = mergeConfigs({
            root: 'to be overridden'
        }, {
            root: [1, 2, 3]
        });
        assert.deepEqual(result, {
            root: [1, 2, 3]
        });
    });

    it('should merge objects deelply', function() {
        var result = mergeConfigs({
            outer: {
                inner: {
                    a: 'a',
                    b: 'should be overridden'
                }
            }
        }, {
            outer: {
                inner: {
                    b: 'correct',
                    c: 'c'
                }
            }
        });

        assert.deepEqual(result, {
            outer: {
                inner: {
                    a: 'a',
                    b: 'correct',
                    c: 'c'
                }
            }
        });
    });
});
