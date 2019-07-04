import { ApiProvider } from './api_page';
import { WazuhCommonProvider } from './wazuh_common_page';
import { ToastsProvider } from './toasts_page';

export const pageObjects = {
    api: ApiProvider,
    wazuhCommon: WazuhCommonProvider,
    toasts: ToastsProvider,
}