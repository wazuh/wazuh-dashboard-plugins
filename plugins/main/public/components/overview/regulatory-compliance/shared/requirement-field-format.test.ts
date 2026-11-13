import {
  getRequirementFieldFormats,
  RequirementFieldFormat,
} from './requirement-field-format';
import { WAZUH_MODULES_ID } from '../../../../../common/constants';
import { pciRequirementsFile } from '../../../../../common/compliance-requirements/pci-requirements';

describe('RequirementFieldFormat', () => {
  it('names the requirement of each value of the framework', () => {
    const format = new RequirementFieldFormat({
      section: WAZUH_MODULES_ID.PCI_DSS,
    });

    expect(format.convert('10.2.1.4')).toBe(
      `10.2.1.4 - ${pciRequirementsFile['10.2.1.4'].title}`,
    );
    expect(format.convert('unknown')).toBe('unknown');
  });

  it('is not offered for any field type in the index pattern management', () => {
    expect(RequirementFieldFormat.fieldType).toEqual([]);
  });
});

describe('getRequirementFieldFormats', () => {
  it('formats the requirement field of the framework', () => {
    expect(getRequirementFieldFormats(WAZUH_MODULES_ID.GDPR)).toEqual({
      'wazuh.rule.compliance.gdpr': {
        type: RequirementFieldFormat,
        params: { section: WAZUH_MODULES_ID.GDPR },
      },
    });
  });

  it('formats nothing for an unknown framework', () => {
    expect(getRequirementFieldFormats('not-a-framework')).toEqual({});
  });
});
