/*
 * Wazuh app - ComplianceRequirements Component - Test
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from 'react';
import { shallow } from 'enzyme';
import { EuiFacetButton, EuiToolTip } from '@elastic/eui';
import { ComplianceRequirements } from './requirements';
import { WAZUH_MODULES_ID } from '../../../../../../common/constants';

const baseProps = () => ({
  section: WAZUH_MODULES_ID.GDPR,
  complianceObject: { IV: ['Article 32', 'Article 33'], II: ['Article 5'] },
  selectedRequirements: { IV: true, II: true },
  requirementCounts: {},
  loadingAlerts: false,
  onChangeSelectedRequirements: jest.fn(),
});

const getFacets = wrapper => wrapper.find(EuiFacetButton);

describe('ComplianceRequirements', () => {
  // The group list is built on every render, so a group with no findings has
  // to render as readily as one with them.
  it('renders a group per entry when no requirement has findings', () => {
    const wrapper = shallow(<ComplianceRequirements {...baseProps()} />);

    expect(getFacets(wrapper)).toHaveLength(2);
    expect(getFacets(wrapper).map(facet => facet.prop('quantity'))).toEqual([
      0, 0,
    ]);
  });

  it('totals the findings of the requirements a group holds', () => {
    const wrapper = shallow(
      <ComplianceRequirements
        {...baseProps()}
        requirementCounts={{ 'Article 32': 1207, 'Article 33': 3 }}
      />,
    );

    // Groups are ordered by quantity, so the one with findings comes first.
    expect(getFacets(wrapper).first().prop('quantity')).toBe(1210);
  });

  // A group identifier only means something inside its own standard: "1" is a
  // PCI DSS requirement and a NIS2 article.
  it('names a group with the label of its own framework', () => {
    const wrapper = shallow(<ComplianceRequirements {...baseProps()} />);
    const names = wrapper
      .find(EuiToolTip)
      .map(tooltip => tooltip.prop('content'));

    expect(names).toContain('Chapter IV - Controller and processor');
  });

  // A NIS2 group is an article, and the article is a requirement of its own,
  // so the standard already names it.
  it('names a group after its own requirement when the group is one', () => {
    const wrapper = shallow(
      <ComplianceRequirements
        {...baseProps()}
        section={WAZUH_MODULES_ID.NIS2}
        complianceObject={{ '1': ['1'] }}
        selectedRequirements={{ '1': true }}
        descriptions={{ '1': { title: 'Subject matter' } }}
      />,
    );

    expect(
      wrapper.find(EuiToolTip).map(tooltip => tooltip.prop('content')),
    ).toEqual(['1 - Subject matter']);
  });

  it('falls back to the identifier when nothing names the group', () => {
    const wrapper = shallow(
      <ComplianceRequirements
        {...baseProps()}
        section={WAZUH_MODULES_ID.NIS2}
        complianceObject={{ '99': ['99'] }}
        selectedRequirements={{ '99': true }}
      />,
    );

    expect(
      wrapper.find(EuiToolTip).map(tooltip => tooltip.prop('content')),
    ).toEqual(['Requirement 99']);
  });
});
