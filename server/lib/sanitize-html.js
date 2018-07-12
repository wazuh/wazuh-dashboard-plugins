/*
 * Wazuh app - Tool to remove html tags from given string
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * Removes html tags from given string
 * @param {*} str Given string
 * @returns {String|Boolean} Cleaned string or false
 */
export default str => {
    if(!str || typeof str !== 'string') return false;
    if(!str.includes('<')) return str;
    while(str.includes('<b>')) str = str.replace('<b>','');
    while(str.includes('<br>')) str = str.replace('<br>','\n');
    while(str.includes('<ul>')) str = str.replace('<ul>','');
    while(str.includes('</ul>')) str = str.replace('</ul>','');
    while(str.includes('<li>')) str = str.replace('<li>','');
    while(str.includes('</li>')) str = str.replace('</li>','\n');
    return str;                    
};