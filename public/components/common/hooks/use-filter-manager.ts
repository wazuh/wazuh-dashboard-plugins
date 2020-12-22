/*
 * Wazuh app - React hook for get Kibana filter manager
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { useState, useEffect} from 'react';
//@ts-ignore
// import { getServices } from '../../../../../../src/plugins/discover/public/kibana_services';
import { getDataPlugin } from '../../../kibana-services';

export const useFilterManager = () => {
    const timefilter = getDataPlugin().query.timefilter;
    const [filterManager, setFilterManager] = useState(timefilter.filterManager);
    return filterManager;
}