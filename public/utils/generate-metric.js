/*
 * Wazuh app - Useful function to manage metrics
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import $ from 'jquery';

export default id => {
    const html = $(id).html();

    // New Kibana structure
    if( html.split('ng-non-bindable') &&
        html.split('ng-non-bindable')[1] &&
        html.split('ng-non-bindable')[1].split('>') &&
        html.split('ng-non-bindable')[1].split('>')[1] && 
        html.split('ng-non-bindable')[1].split('>')[1].split('</') && 
        html.split('ng-non-bindable')[1].split('>')[1].split('</')[0]) {

        return html.split('ng-non-bindable')[1].split('>')[1].split('</')[0]
    
    }

    if (typeof html !== 'undefined' && html.includes('<span')) {
        if(typeof html.split('<span>')[1] !== 'undefined'){
            return html.split('<span>')[1].split('</span')[0];
        } else if(html.includes('table') && html.includes('cell-hover')){
            let nonB = html.split('ng-non-bindable')[1];
            if(nonB &&
                nonB.split('>')[1] &&
                nonB.split('>')[1].split('</')[0]
            ) {
                return nonB.split('>')[1].split('</')[0];
            }
        }
    }
    return '';
}