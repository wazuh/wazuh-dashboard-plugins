import { defaultFetchInit } from '@splunk/splunk-utils/fetch';
import { createRESTURL } from '@splunk/splunk-utils/url';

const WEB_SETTINGS = createRESTURL('properties/web/smc?output_mode=json');

/**
 *
 * @param {*} settings
 * @param {*} name
 * @returns {string}
 */
function getSetting(settings, name) {
    if (!settings) {
        return null;
    }
    const obj = settings.find(setting => setting.name === name);
    return obj ? obj.content : null;
}

async function loadWebSettings() {
    try {
        const response = await fetch(WEB_SETTINGS, {
            ...defaultFetchInit,
        });
        if (response.status === 200) {
            return response.json();
        }
    } catch (error) {
        // eslint-disable-next-line no-restricted-globals
        console.error(error);
    }
    return {};
}

async function loadURLFromFile() {
    const webSettings = await loadWebSettings();
    return getSetting(webSettings.entry, 'remoteRoot');
}

async function loadRemoteURL() {
    const urlFromFile = await loadURLFromFile();
    if (urlFromFile) {
        return urlFromFile;
    }

    return createRESTURL('assist/ui/assets');
}

/**
 *
 * @returns
 */
export default async function loadRemoteConfigs() {
    const remoteRoot = await loadRemoteURL();
    return [
        {
            id: 'splunk-assist',
            remoteRoot,
        },
    ];
}
