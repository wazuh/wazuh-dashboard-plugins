/*
 * Wazuh app - ComplianceSubrequirements Component - Test
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
import { shallow } from 'enzyme';
import { EuiPopover } from '@elastic/eui';
import { ComplianceSubrequirements } from './subrequirements';
import { RequirementFlyout } from '../requirement-flyout';

// EuiFacetButton is passed as the `button` prop of EuiPopover (a render
// prop), not as a direct child, so enzyme's shallow `.find()` can't reach it
// directly - read it off the EuiPopover's `button` prop instead.
const getFacetButtons = wrapper =>
  wrapper.find(EuiPopover).map(popover => popover.prop('button'));

jest.mock('../../../../../kibana-services', () => ({
  getDataPlugin: () => ({
    query: { filterManager: { addFilters: jest.fn() } },
  }),
}));

jest.mock('../../../../../react-services/app-state', () => ({
  AppState: { getCurrentPattern: () => 'test-pattern' },
}));

const baseProps = () => ({
  section: 'pci-dss',
  complianceObject: {},
  descriptions: {},
  selectedRequirements: {},
  requirementsCount: [],
  loadingAlerts: false,
  othersCount: 7,
  fetchFilters: [],
  getRegulatoryComplianceRequirementFilter: jest.fn(() => []),
  getRegulatoryComplianceOtherRequirementsFilter: jest.fn(() => []),
  onSelectedTabChanged: jest.fn(),
  filters: [],
  setFilters: jest.fn(),
});

describe('ComplianceSubrequirements - Others tile', () => {
  it('always renders an Others tile with the given count, even with no known requirements', () => {
    const wrapper = shallow(<ComplianceSubrequirements {...baseProps()} />);
    const buttons = getFacetButtons(wrapper);
    expect(buttons).toHaveLength(1);
    expect(buttons[0].props.quantity).toBe(7);
  });

  it('does not throw and does not render the Others tile when a search value not matching "others" is entered', () => {
    const wrapper = shallow(<ComplianceSubrequirements {...baseProps()} />);
    expect(() =>
      wrapper.instance().onSearchValueChange({
        target: { value: 'unrelated-search-text' },
      }),
    ).not.toThrow();
    wrapper.update();
    expect(getFacetButtons(wrapper)).toHaveLength(0);
  });

  it('matches the Others tile when the search value is a substring of "others"', () => {
    const wrapper = shallow(<ComplianceSubrequirements {...baseProps()} />);
    wrapper.instance().onSearchValueChange({ target: { value: 'oth' } });
    wrapper.update();
    expect(getFacetButtons(wrapper)).toHaveLength(1);
  });

  it('opens the flyout with isOthers=true and the generic title when the Others tile is clicked', () => {
    const props = baseProps();
    const wrapper = shallow(<ComplianceSubrequirements {...props} />);
    const [othersButton] = getFacetButtons(wrapper);
    othersButton.props.onClick();
    wrapper.update();

    const flyout = wrapper.find(RequirementFlyout);
    expect(flyout).toHaveLength(1);
    expect(flyout.prop('isOthers')).toBe(true);
    expect(flyout.prop('title')).toBe('Other requirements');
    expect(
      props.getRegulatoryComplianceOtherRequirementsFilter,
    ).toHaveBeenCalled();
    expect(
      props.getRegulatoryComplianceRequirementFilter,
    ).not.toHaveBeenCalled();
  });

  it('hides the Others tile when "hide requirements with no findings" is on and the count is 0', () => {
    const wrapper = shallow(
      <ComplianceSubrequirements {...baseProps()} othersCount={0} />,
    );
    wrapper.instance().hideAlerts();
    wrapper.update();
    expect(getFacetButtons(wrapper)).toHaveLength(0);
  });
});
