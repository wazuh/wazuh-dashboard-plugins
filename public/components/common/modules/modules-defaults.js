/*
 * Wazuh app - Simple description for each App tabs
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const ModulesDefaults = {
    fim: {
        init: 'states',
        tabs: [
            { id: 'states', name: 'States' },
            { id: 'events', name: 'Events' }
        ],
        buttons: ['dashboard', 'reporting', 'settings']
    },
    sca: {
        init: 'states',
        tabs: [
            { id: 'states', name: 'States' },
            { id: 'events', name: 'Events' }
        ],
        buttons: ['settings']
    },
    syscollector: {
        notModule: true,
    },
    configuration: {
        notModule: true,
    },
};
