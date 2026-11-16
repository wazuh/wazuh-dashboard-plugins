/*
 * Wazuh app - Tests of the regulatory compliance frameworks
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WAZUH_MODULES_ID } from '../constants';
import { getFrameworkDefinition, getRequirementCodeLabel } from './frameworks';
import { pciRequirementsFile } from './pci-requirements';

describe('getFrameworkDefinition', () => {
  // A FedRAMP identifier is a NIST 800-53 one (AC-2(1)) and holds no dot, so
  // splitting it on dots gave one group per control.
  it('groups FedRAMP by control family, like NIST 800-53', () => {
    const fedramp = getFrameworkDefinition(WAZUH_MODULES_ID.FEDRAMP);
    const nist = getFrameworkDefinition(WAZUH_MODULES_ID.NIST_800_53);

    expect([fedramp?.entriesBySeparator, fedramp?.separator]).toEqual([1, '-']);
    expect([nist?.entriesBySeparator, nist?.separator]).toEqual([1, '-']);
  });

  it('resolves the ruleset notation of every framework that has one', () => {
    for (const section of [
      WAZUH_MODULES_ID.GDPR,
      WAZUH_MODULES_ID.HIPAA,
      WAZUH_MODULES_ID.CMMC,
      WAZUH_MODULES_ID.NIS2,
    ]) {
      const resolver = getFrameworkDefinition(section)?.resolver;

      expect(resolver?.aliases || resolver?.derive).toBeDefined();
    }
  });
});

describe('getRequirementCodeLabel', () => {
  it('names a documented requirement after its identifier', () => {
    expect(getRequirementCodeLabel(WAZUH_MODULES_ID.PCI_DSS, '10.2.1.4')).toBe(
      `10.2.1.4 - ${pciRequirementsFile['10.2.1.4'].title}`,
    );
  });

  // The findings keep the ruleset notation, and so does the label, so it still
  // matches what the filters and the findings show.
  it('names a value written in the ruleset notation', () => {
    expect(getRequirementCodeLabel(WAZUH_MODULES_ID.GDPR, 'IV_35.7.d')).toBe(
      'IV_35.7.d - Data protection impact assessment',
    );
  });

  it('keeps the value of an unknown requirement or framework', () => {
    expect(getRequirementCodeLabel(WAZUH_MODULES_ID.PCI_DSS, 'unknown')).toBe(
      'unknown',
    );
    expect(getRequirementCodeLabel('not-a-framework', '10.2.1.4')).toBe(
      '10.2.1.4',
    );
  });
});
