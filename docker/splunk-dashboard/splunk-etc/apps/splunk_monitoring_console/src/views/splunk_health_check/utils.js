/**
 * Created by ykou on 2/16/16.
 */
define([
    'underscore'
], function(
    _
) {
    var ICON_CLASS_NAME = {
        na: 'icon-minus-circle',
        rotate: 'icon-rotate',
        check: 'icon-check-circle',
        info: 'icon-info-circle',
        warning: 'icon-warning',
        error: 'icon-alert'
    };

    var SEVERITY_LEVEL_ICON_CLASS_NAME = {
        '-1': {
            icon: ICON_CLASS_NAME.na,
            tooltip: _('Not Applicable').t(),
            reasonClassName: 'na'
        },
        0: {
            icon: ICON_CLASS_NAME.check,
            tooltip: _('Success').t(),
            reasonClassName: 'success'
        },
        1: {
            icon: ICON_CLASS_NAME.info,
            tooltip: _('Information').t(),
            reasonClassName: 'info'
        },
        2: {
            icon: ICON_CLASS_NAME.warning,
            tooltip: _('Warning').t(),
            reasonClassName: 'warning'
        },
        3: {
            icon: ICON_CLASS_NAME.error,
            tooltip: _('Error').t(),
            reasonClassName: 'error'
        }
    };

    var TASK_NOT_COMPLETE_YET = _('This health check item has not been run or is still running. Check back when it is complete.').t();

    var TASK_COMPLETE_SUCCESS = _('This health check item was successful.').t();

    var TASK_NOT_APPLICABLE = _('This health check item is not applicable.').t();
    
    var TASK_INCLUDE_SUCCESS_AND_NA = _('This health check item is not applicable to some instances and succeeds on the rest.').t();

    var getSeverityLevelIndexFromRaw = function(data) {
        return data.fields.indexOf('severity_level');
    };

    var getIndexFromRaw = function (match, data) {
        return data.fields.indexOf(match);
    };

    // this is shared in both standalone mode and distributed mode
    var renderMVField = function(field) {
        if (_.isArray(field)) {
            return _.map(field, function(value) {
                return '<div>' + value + '</div>';
            }).join('');
        }
        else {
            return field;
        }
    };

    var makeSafeCssClassName = function(name) {
        return name.replace(/[!\"#$%&'\(\)\*\+,\s\.\/:;<=>\?\@\[\\\]\^`\{\|\}~]/g, '-');
    };

    return {
        ICON_CLASS_NAME: ICON_CLASS_NAME,
        SEVERITY_LEVEL_ICON_CLASS_NAME: SEVERITY_LEVEL_ICON_CLASS_NAME,
        TASK_NOT_COMPLETE_YET: TASK_NOT_COMPLETE_YET,
        TASK_COMPLETE_SUCCESS: TASK_COMPLETE_SUCCESS,
        TASK_NOT_APPLICABLE: TASK_NOT_APPLICABLE,
        TASK_INCLUDE_SUCCESS_AND_NA: TASK_INCLUDE_SUCCESS_AND_NA,
        getSeverityLevelIndexFromRaw: getSeverityLevelIndexFromRaw,
        getIndexFromRaw: getIndexFromRaw,
        renderMVField: renderMVField,
        makeSafeCssClassName: makeSafeCssClassName
    };
});