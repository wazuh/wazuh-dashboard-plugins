/*
 * Wazuh app - Utils related to Kibana and app versions
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
import { kibana as appPackageKibana } from '../package.json';
import semver from 'semver';

export const satisfyKibanaVersion = (requiredKibanaVersion: string) => semver.satisfies(appPackageKibana.version, requiredKibanaVersion);
