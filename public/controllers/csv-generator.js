/*
 * Wazuh app - CSV file generator
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default class CsvGenerator {

    constructor (dataArray, fileName) {
        this.dataArray = dataArray;
        this.fileName = fileName;
    }

    getLinkElement (linkText) {
        return this.linkElement = this.linkElement || $('<a>' + (linkText || '') + '</a>', {
            href: 'data:attachment/csv;base64,' + encodeURI(btoa(this.dataArray)),
            target: '_blank',
            download: this.fileName
        });
    }

    download (removeAfterDownload) {
        this.getLinkElement().css('display', 'none').appendTo('body');
        this.getLinkElement()[0].click();
        if (removeAfterDownload) {
            this.getLinkElement().remove();
        }
    }
}