/*
 * Wazuh app - Factory to store visualizations handlers
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzSecurityXpack } from '../react-services/wz-security-xpack';
import { WzSecurityOpendistro } from '../react-services/wz-security-opendistro';
import { WAZUH_SECURITY_PLUGIN_XPACK_SECURITY, WAZUH_SECURITY_PLUGIN_OPEN_DISTRO_FOR_ELASTICSEARCH } from '../../common/constants';
import store from '../redux/store';


export class WazuhSecurity {
  /**
   * Class constructor
   */
  constructor() {
    if (!!WazuhSecurity.instance) {
      return WazuhSecurity.instance;
    }
    const platform = store.getState().appStateReducers.currentPlatform;
    if(platform === WAZUH_SECURITY_PLUGIN_XPACK_SECURITY){
      this.security = WzSecurityXpack;
    }else if(platform === WAZUH_SECURITY_PLUGIN_OPEN_DISTRO_FOR_ELASTICSEARCH){
     this.security =  WzSecurityOpendistro;
    }else{
      this.security = false;
    }

    WazuhSecurity.instance = this;
    return this;
  }

}
