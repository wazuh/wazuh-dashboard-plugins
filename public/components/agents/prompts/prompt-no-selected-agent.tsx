/*
 * Wazuh app - Prompt when no agent selected
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { PromptSelectAgent } from './';
import { i18n } from '@kbn/i18n';
const moduleTitle = i18n.translate('components.addModule.guide.moduleTitle', {
  defaultMessage: 'No agent is selected',
});
export const PromptNoSelectedAgent = ({ body }) => {
  return <PromptSelectAgent body={body} title={moduleTitle} />;
};
