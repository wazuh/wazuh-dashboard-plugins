/*
 * Wazuh app - Check Template Service
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import { AppState, GenericRequest, SavedObject } from '../../../react-services';

export const checkTemplateService = async (): Promise<{ errors: string[] }> => {
  const errors: string[] = [];
  const patternId = AppState.getCurrentPattern();
  let patternTitle = '';
  const patternData = patternId ? (await SavedObject.existsIndexPattern(patternId)) || {} : {};
  patternTitle = patternData.title;

  const templateData = await GenericRequest.request('GET', `/elastic/template/${patternTitle}`);
  if (!templateData.data.status) {
    errors.push(`No template found for the selected index-pattern [${patternTitle}]`);
  }
  return { errors };
};
