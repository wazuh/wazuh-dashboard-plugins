/*
 * Wazuh app - Factory to store visualizations raw content
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules'

const app = uiModules.get('app/wazuh', []);

class RawVisualizations {
    constructor() {
        this.list = [];
    }

    addItem(item) {
        this.list.push(item);
    }

    assignItems(items) {
        this.list = Array.isArray(items) ? items : [];
    }

    getList() {
        return this.list;
    }

    removeAll() {
        this.list = [];
    }
}

app.service('rawVisualizations', RawVisualizations);