/*
 * Wazuh app - React hook for get Kibana plugin dependecies
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { AppDependencies } from '../types';
import { useKibana } from '../../../../src/plugins/kibana_react/public';

export const useAppDeps = () => useKibana().services as AppDependencies;
