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

export const shouldShowComponent = (component, agent) => {
  const platform = (agent.os &&  agent.os.uname && agent.os.uname.includes('Linux')) ? 'linux' : agent.os && agent.os.platform;
  return !(
    UnsupportedComponents[platform] || UnsupportedComponents['other']
  ).includes(component);
};
