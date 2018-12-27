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
export async function totalRAM(genericReq, errorHandler) {
  try {
    const data = await genericReq.request('GET', '/utils/memory');
    const totalRAM = data.data.ram;
    if (totalRAM < 1600 && totalRAM > 1024) {
      errorHandler.handle(
        `Kibana server has ${totalRAM}MB of RAM, performance will suffer. Please increase it.`,
        'RAM',
        true
      );
    } else if (totalRAM <= 1024) {
      errorHandler.handle(
        `Kibana server has ${totalRAM}MB of RAM, performance will suffer. Please increase it.`,
        'RAM'
      );
    }
  } catch (error) {
    errorHandler.handle(
      `Kibana server has an unknown amount of RAM, please review it.`,
      'RAM',
      true
    );
  }
}
