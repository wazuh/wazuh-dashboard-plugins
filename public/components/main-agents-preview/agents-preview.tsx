import React, { Component } from 'react';
import { EuiLoadingSpinner, EuiDescriptionList, EuiIcon, EuiCallOut, EuiSpacer, EuiButton } from '@elastic/eui';
import { AppState } from '../../react-services/app-state';
import { PatternHandler } from '../../react-services/pattern-handler';
import { getAngularModule, getToasts, getHttp } from '../../kibana-services';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { GenericRequest } from '../../react-services/generic-request';
import { ApiCheck } from '../../react-services/wz-api-check';
import { WzRequest } from '../../react-services/wz-request';
import { SavedObject } from '../../react-services/saved-objects';
import { ErrorHandler } from '../../react-services/error-handler';
import { WAZUH_MONITORING_PATTERN } from '../../../common/constants';
import { checkKibanaSettings, checkKibanaSettingsTimeFilter } from './lib';

export const AgentsPreview = () => {

/**
   * Returns the Wazuh version as x.y.z
   */
  async getWazuhVersion() {
    try {
      const data = await WzRequest.apiReq('GET', '//', {});
      const result = ((data || {}).data || {}).data || {};
      
      console.log("result");
      console.log(result);
      console.log(result);
      console.log(result);
      
      return result.api_version
    } catch (error) {
      console.log("error");
      console.log(error);
      console.log(error);
      console.log(error);
      return version;
    }
  }


  return (
    <div>

    </div>
  )
}
