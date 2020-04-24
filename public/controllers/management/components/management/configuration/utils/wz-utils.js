/*
 * Wazuh app - Other utils.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { UnsupportedComponents } from '../../../../../../utils/components-os-support';
import WzConfigurationSettings from '../configuration-settings';

export const shouldShowComponent = (component, agent) => {
  return !(
    UnsupportedComponents[agent.agentPlatform] || UnsupportedComponents['other']
  ).includes(component);
};
