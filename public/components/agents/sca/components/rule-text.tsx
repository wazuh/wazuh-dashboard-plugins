/*
 * Wazuh app - RuleText component
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
import { EuiText } from '@elastic/eui';

interface RuleTextProps {
  rules: { type: string; rule: string }[];
}

export const RuleText: React.FunctionComponent<RuleTextProps> = ({ rules }) => {
  return (
    <EuiText size="s">
      <ul>
        {rules.map((rule, idx) => (
          <li key={`check-rule-${idx}`}>{rule.rule}</li>
        ))}
      </ul>
    </EuiText>
  );
};
