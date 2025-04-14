import { version } from '../package.json';

export const PLUGIN_ID = 'wazuhFleet';
export const PLUGIN_NAME = 'wazuh_fleet';
export const PLUGIN_VERSION_SHORT = version.split('.').splice(0, 2).join('.');

// Documentation
export const DOCUMENTATION_WEB_BASE_URL = 'https://documentation.wazuh.com';

// ID used to refer the createOsdUrlStateStorage state
export const OSD_URL_STATE_STORAGE_ID = 'state:storeInSessionStorage';
