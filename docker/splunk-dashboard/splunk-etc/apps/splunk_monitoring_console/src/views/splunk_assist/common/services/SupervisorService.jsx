import { defaultFetchInit } from '@splunk/splunk-utils/fetch';
import { createRESTURL } from '@splunk/splunk-utils/url';

const SUPERVISOR_URL = createRESTURL('assist/optin_status');

export default {
    /**
     * @returns {{isConnectivityOpen: boolean, isFipsEnabled: boolean, isSUDEnabled: boolean, isAssistEnabled: boolean}}
     */
    getStatus: async () => {
        try {
            const response = await fetch(SUPERVISOR_URL, {
                ...defaultFetchInit,
            });

            if (response.status !== 200) {
                throw new Error(`Bad response from the Supervisor: Status code=${response.status}`);
            }
            const json = await response.json();
            const payload = json.payload;
            if (!payload) {
                throw new Error('Bad response from the Supervisor: Missing payload!');
            }
            const context = payload.context;
            if (!context) {
                throw new Error('Bad response from the Supervisor: Missing context!');
            }
            return {
                isFipsEnabled: !context.crypto_compatible,
                isConnectivityOpen: context.network_connectivity,
                isSUDEnabled: context.sud_optin,
                isAssistEnabled: context.assist_optin === 'enabled',
            };
        } catch (error) {
            // eslint-disable-next-line no-restricted-globals
            console.error(error);
            throw new Error(`Bad response from the Supervisor: ${error}`);
        }
    },
};
