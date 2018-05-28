/*
 * Wazuh app - Module to check total RAM available
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default async (genericReq, errorHandler) => {
    try {
        const data = await genericReq.request('GET', '/api/wazuh-api/ram');
        const totalRAM = data.data.ram
        if(totalRAM < 3072 && totalRAM > 2048) {
            errorHandler.handle(`The machine where Kibana is being executed has ${totalRAM}MB of RAM, please increase it.`, 'RAM', true);
        } else if(totalRAM < 2048) {
            errorHandler.handle(`The machine where Kibana is being executed has ${totalRAM}MB of RAM, please increase it.`, 'RAM');
        }
    } catch (error){
        errorHandler.handle(`The machine where Kibana is being executed has an unknown amount of RAM, please review it.`, 'RAM', true);
    }
}