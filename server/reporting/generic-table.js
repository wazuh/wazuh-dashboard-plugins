/*
 * Wazuh app - Base table for reporting tables
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
 * Useful function to build tables using pdfmake
 * @param {*} document Document provided by pdfmake module
 * @param {Array<*>} items List of items (rows)
 * @param {Array<String>} keys Properties from each item
 * @param {Array<String>} columns Columns for the table. E.g: ['Col1','Col2','Col3']
 * @param {String} title Optional. Title for the table
 */
export default (document, items, columns, keys, title, givenRows = false) => {

    if(!document || !columns || !columns.length) {
        throw new Error('Missing parameters when building table');
    }

    if(title) {
        document.content.push({ text: title, style: 'h4' });
        document.content.push({text:'\n'})
    }

    if(!items || !items.length) {
        document.content.push({ text: 'No results match your search criteria', style:'standard'});
        return;
    }

    const rowSize = givenRows ? items[0].length : keys.length;
    const rows    = givenRows ? items : [];
    const modifiedRows = [];
    if(!givenRows){
        for(const item of items){
            const str = new Array(rowSize).fill('---');
            for(let i=0; i<keys.length; i++){
                if(keys[i].includes('.')){
                    const parent = keys[i].split('.')[0];
                    const child  = keys[i].split('.')[1];
                    if(item[parent] && item[parent][child]) {
                        str[i] = item[parent][child];
                    }
                } else if(item[keys[i]]) {
                    str[i] = item[keys[i]];
                }                
            }
            rows.push(str.map(cell => {
                return {text:cell,style:'standard'};
            }));                        
        }
    } else {
        
        for(const row of rows){
            modifiedRows.push(row.map(cell => {
                return {text:cell,style:'standard'};
            }));
        }
    }

    const fullBody = [];

    const widths = new Array(rowSize-1).fill('auto');
    widths.push('*');
    fullBody.push(
        columns.map(col => {
            return {text:col,style:'whiteColor',border:[0,0,0,0]};
        }) 
    );

    if(givenRows){
        fullBody.push(...modifiedRows);
    } else {
        fullBody.push(...rows);
    }

    document.content.push({
        fontSize:8,
        table: {
            headerRows:1,
            widths,
            body: fullBody
        },
        layout: {
            fillColor: i => i === 0 ? '#78C8DE' : null,
            hLineColor: () => '#78C8DE',
            hLineWidth: () => 1,
            vLineWidth: () => 0
        }
    });
};