/*
 * Wazuh app - Factory to store visualizations handlers
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzSecurityXpack } from '../react-services/wz-security-xpack';
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
    if(platform === 'xpack'){
      this.security = WzSecurityXpack;
    }else{
      this.security = false;
    }

    WazuhSecurity.instance = this;
    return this;
  }

}
