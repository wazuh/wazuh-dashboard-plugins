/*
 * Wazuh app - Utils related to plugin platform and app versions
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */
import { pluginPlatform as appPackagePluginPlatform } from '../package.json';
import semver from 'semver';

/**
 * 
 * @param requiredPluginPlatformVersion semver condition that should fulfill the plugin platform version
 * @returns if validation is true or false
 */
export const satisfyPluginPlatformVersion = (requiredPluginPlatformVersion: string): boolean => semver.satisfies(appPackagePluginPlatform.version, requiredPluginPlatformVersion);
