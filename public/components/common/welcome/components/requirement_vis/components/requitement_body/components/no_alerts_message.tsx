/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from 'react';
import { EuiEmptyPrompt } from '@elastic/eui';


export function NoAlertsMessage({ requirement }) {
  const formatedRequirement = requirements[requirement]
  return (
    <EuiEmptyPrompt
      iconType="stats"
      title={<h4>You dont have {formatedRequirement} alerts for this time range</h4>}
      body={
        <p>
          You have no alerts related to {formatedRequirement} in this time range.
          Modify the time range to view data, if it exists.
          </p>
      }
    />
  )
}

const requirements = {
  'pci_dss': 'PCI DSS',
  'gdpr': 'GDPR',
  'nist_800_53': 'NIST 800-53',
  'hipaa': 'HIPAA',
  'gpg13': 'GPG13',
  'tsc': 'TSC',
};