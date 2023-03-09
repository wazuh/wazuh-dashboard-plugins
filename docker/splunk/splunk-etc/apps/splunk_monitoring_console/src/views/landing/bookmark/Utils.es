import { _ } from '@splunk/ui-utils/i18n';
import { isEmpty } from 'lodash';

export const URL_MISSING_MC_MESSAGE = _('URL must contain splunk_monitoring_console.');
export const URL_BLANK_MESSAGE = _('URL must be entered.');
export const URL_NOT_ABSOLUTE_MESSAGE = _('URL must be absolute.');
export const LABEL_BLANK_MESSAGE = _('Label must be entered.');
export const LABEL_TOO_LONG_MESSAGE = _('Label can only be 25 characters long.');
export const LABEL_ALREADY_IN_USE = _('Label already in use.');

/**
 * Validate the bookmark URL.
 * @param {String} url
 * @returns {String} error message, empty if no error.
 */
export function validateUrl(url) {
    if (isEmpty(url)) {
        return URL_BLANK_MESSAGE;
    } else if (!url.includes('splunk_monitoring_console')) {
        return URL_MISSING_MC_MESSAGE;
    } else if (!new RegExp('^([a-z]+://|//)', 'i').test(url)) {
        return URL_NOT_ABSOLUTE_MESSAGE;
    }
    return '';
}

/**
 * Validate the bookmark label.
 * @param {String} label
 * @param {Array} array of labels.
 * @param {Boolean} if true check for duplicates.
 * @returns {String} error message, empty if no error.
 */
export function validateLabel(label, labels, checkDups) {
    if (isEmpty(label)) {
        return LABEL_BLANK_MESSAGE;
    } else if (label.length > 25) {
        return LABEL_TOO_LONG_MESSAGE;
    } else if (checkDups && labels.indexOf(label) !== -1) {
        return LABEL_ALREADY_IN_USE;
    }
    return '';
}

/**
 * Return an array containing only the valid bookmarks.
 * @param {Array} bookmarks
 * @returns {Array} valid bookmarks
 */
export function getValidBookmarks(bookmarksArray) {
    const validBookmarks = [];
    const labels = bookmarksArray.map(bookmark => bookmark.label);
    bookmarksArray.forEach((bookmark) => {
        const validUrl = validateUrl(bookmark.url);
        const validLabel = validateLabel(bookmark.label, labels, false);
        if (isEmpty(validUrl) && isEmpty(validLabel)) {
            validBookmarks.push(bookmark);
        }
    });
    return validBookmarks;
}
