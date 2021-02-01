/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from 'react'
import {
  EuiFlexGroup,
  EuiText,
  EuiSelect,
} from '@elastic/eui';


export function RequirementsHead({ requirement, setRequirement }) {
  return (
    <EuiFlexGroup
      style={{ padding: '12px 12px 0px' }}
      className="embPanel__header" >
      <h2 className="embPanel__title wz-headline-title">
        <EuiText size="xs"><h2>Compliance</h2></EuiText>
      </h2>
      <div style={{ width: "auto", paddingTop: 6, paddingRight: 12 }}>
        <EuiSelect
          compressed={true}
          id="requirementSelect"
          options={requirements}
          value={requirement}
          onChange={e => setRequirement(e.target.value)}
          aria-label="Select requirement"
        />
      </div>
    </EuiFlexGroup>
  )
}

const requirements = [
  { value: 'pci_dss', text: 'PCI DSS' },
  { value: 'gdpr', text: 'GDPR' },
  { value: 'nist_800_53', text: 'NIST 800-53' },
  { value: 'hipaa', text: 'HIPAA' },
  { value: 'gpg13', text: 'GPG13' },
  { value: 'tsc', text: 'TSC' },
];