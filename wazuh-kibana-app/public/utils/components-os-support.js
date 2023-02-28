/*
 * Wazuh app - Components compatibility operative system
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WAZUH_AGENTS_OS_TYPE, WAZUH_MODULES_ID } from '../../common/constants';

export const UnsupportedComponents = {
  [WAZUH_AGENTS_OS_TYPE.LINUX]: [],
  [WAZUH_AGENTS_OS_TYPE.WINDOWS]: [WAZUH_MODULES_ID.AUDITING, WAZUH_MODULES_ID.DOCKER, WAZUH_MODULES_ID.OPEN_SCAP],
  [WAZUH_AGENTS_OS_TYPE.DARWIN]: [WAZUH_MODULES_ID.AUDITING, WAZUH_MODULES_ID.DOCKER, WAZUH_MODULES_ID.OPEN_SCAP],
  [WAZUH_AGENTS_OS_TYPE.SUNOS]: [WAZUH_MODULES_ID.VULNERABILITIES],
  [WAZUH_AGENTS_OS_TYPE.OTHERS]: [WAZUH_MODULES_ID.AUDITING, WAZUH_MODULES_ID.DOCKER, WAZUH_MODULES_ID.OPEN_SCAP, WAZUH_MODULES_ID.VULNERABILITIES]
};
