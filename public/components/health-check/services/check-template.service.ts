/*
 * Wazuh app - Check Template Service
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import SavedObject from '../../../react-services/saved-objects';
import AppState from '../../../react-services/app-state';
import GenericRequest from '../../../react-services/generic-request';

export const checkTemplateService = async (): Promise<{ errors: string[] }> => {
  let errors: string[] = [];
  const patternId = AppState.getCurrentPattern();
  let patternTitle = '';
  let patternData = patternId ? await SavedObject.existsIndexPattern(patternId) : false;
  if (!patternData) patternData = {};
  patternTitle = patternData.title;

  const templateData = await GenericRequest.request('GET', `/elastic/template/${patternTitle}`);
  if (!templateData.data.status) {
    errors.push('No template found for the selected index-pattern.');
  }
  return { errors };
};
