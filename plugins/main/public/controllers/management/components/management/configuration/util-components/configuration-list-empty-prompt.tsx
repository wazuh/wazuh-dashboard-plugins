/*
 * Wazuh app - Layout shared by the empty states of configuration lists.
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { ReactNode } from 'react';
import { EuiEmptyPrompt, EuiLink, EuiText } from '@elastic/eui';

interface ConfigurationListEmptyPromptProps {
  title: string;
  body: string;
  guide: { text: string; href: string };
  action?: ReactNode;
}

// Same shape as the page's "not reported" prompt: title, body, guide link, one action.
export const ConfigurationListEmptyPrompt = ({
  title,
  body,
  guide,
  action,
}: ConfigurationListEmptyPromptProps) => (
  <EuiEmptyPrompt
    titleSize='xs'
    title={<h4>{title}</h4>}
    body={
      <EuiText size='s'>
        <p>{body}</p>
        <EuiLink
          href={guide.href}
          target='_blank'
          rel='noopener noreferrer'
          external
        >
          {guide.text}
        </EuiLink>
      </EuiText>
    }
    actions={action}
  />
);
