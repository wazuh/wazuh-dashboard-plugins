/*
 * Wazuh app - React component for showing the Mitre Att&ck resource button.
 *
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
import './resource_button.scss';

export const ModuleMitreAttackIntelligenceResourceButton = ({children, isSelected = false, className = '', ...rest }) => {
  return (
    <button
      className={`moduleMitreAttackIntelligenceResourceButton ${isSelected ? 'moduleMitreAttackIntelligenceResourceButton--selected' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
};
