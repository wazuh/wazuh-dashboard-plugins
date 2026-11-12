import React from 'react';
import { createRegulatoryComplianceColumns } from './create-regulatory-compliance-columns';

describe('createRegulatoryComplianceColumns', () => {
  const columns = createRegulatoryComplianceColumns(
    'wazuh.rule.compliance.pci_dss',
    300,
  );

  it('names every column in words instead of by its field', () => {
    expect(columns.map(({ id, displayAsText }) => [id, displayAsText])).toEqual(
      [
        ['@timestamp', 'Time'],
        ['wazuh.agent.name', 'Agent'],
        ['wazuh.rule.compliance.pci_dss', 'Requirements'],
        ['wazuh.integration.category', 'Category'],
        ['wazuh.integration.name', 'Integration'],
        ['wazuh.rule.title', 'Rule'],
      ],
    );
  });

  it('keeps the field name in the header tooltip and the column settings', () => {
    const column = columns.find(
      ({ id }) => id === 'wazuh.rule.compliance.pci_dss',
    );

    expect((column?.display as React.ReactElement).props.content).toBe(
      'wazuh.rule.compliance.pci_dss',
    );
    expect(column?.initialWidth).toBe(300);
    expect(columns[0].isSortable).toBe(true);
  });
});
