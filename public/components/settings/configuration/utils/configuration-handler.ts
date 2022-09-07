/*
 * Wazuh app - Configuration handler service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from '../../../../react-services/wz-request';
import { AppState } from '../../../../react-services/app-state';
import path from 'path';
import { EpluginSettingType, PLUGIN_SETTINGS } from '../../../../../common/constants';
import { formatSettingValueFromForm } from '../../../../../common/services/settings';

export default class ConfigurationHandler {
  /**
   * Set the configuration key
   */
  static async editKey(key, value) {
    // TODO: This could be removed when ip.selector setting is removed.
    const pluginSetting = PLUGIN_SETTINGS[key];
    if (key === 'ip.selector') {
      AppState.setPatternSelector(value);
    }
    if(pluginSetting.configurableFile){
      return await WzRequest.genericReq('PUT', '/utils/configuration', {
        key,
        value: formatSettingValueFromForm(pluginSetting, value)
      });
    }else if (pluginSetting.type === EpluginSettingType.filepicker && !pluginSetting.configurableFile){
      const formData = new FormData();
      formData.append('file', value, value.name);
      formData.append('extension', path.extname(value.name));
      return await WzRequest.genericReq('PUT', `/utils/configuration/files/${key}`, formData, {overwriteHeaders: {'content-type': 'multipart/form-data'}});
    };
  }

  /**
   * Delete file
   */
   static async deleteFile(settingKey: keyof typeof EpluginSettingType) {
    return WzRequest.genericReq('DELETE', `/utils/configuration/files/${settingKey}`);
  }
}
