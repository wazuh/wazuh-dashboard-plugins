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
import { EuiFlexGrid, EuiPopover } from '@elastic/eui';
import { ComplianceSubrequirements } from './subrequirements';
import { RequirementFlyout } from '../requirement-flyout';

// EuiFacetButton is passed as the `button` prop of EuiPopover (a render
// prop), not as a direct child, so enzyme's shallow `.find()` can't reach it
// directly - read it off the EuiPopover's `button` prop instead.
const getFacetButtons = wrapper =>
  wrapper.find(EuiPopover).map(popover => popover.prop('button'));

const mockAddFilters = jest.fn();
const mockUpdateAndNavigateSearchParams = jest.fn();

jest.mock('../../../../../kibana-services', () => ({
  getDataPlugin: () => ({
    query: { filterManager: { addFilters: mockAddFilters } },
  }),
}));

jest.mock('../../../../../react-services/navigation-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      updateAndNavigateSearchParams: mockUpdateAndNavigateSearchParams,
    }),
  },
}));

// requirement-flyout.tsx (imported transitively) uses AppState.getClusterInfo(),
// and the real app-state module has import-time side effects that need
// browser cookies unavailable in this test environment.
jest.mock('../../../../../react-services/app-state', () => ({
  AppState: { getClusterInfo: () => ({ cluster: 'test-cluster' }) },
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
  indexPatternId: 'test-index-pattern',
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

describe('ComplianceSubrequirements - Show in dashboard / Inspect in findings', () => {
  beforeEach(() => {
    mockAddFilters.mockClear();
    mockUpdateAndNavigateSearchParams.mockClear();
  });

  it('navigates to the dashboard tab and filters by the current data source index pattern', () => {
    const wrapper = shallow(<ComplianceSubrequirements {...baseProps()} />);
    wrapper.instance().openDashboard({}, '1.1');

    expect(mockAddFilters).toHaveBeenCalledWith([
      expect.objectContaining({
        meta: expect.objectContaining({ index: 'test-index-pattern' }),
      }),
    ]);
    expect(mockUpdateAndNavigateSearchParams).toHaveBeenCalledWith({
      tabSubView: 'dashboard',
    });
  });

  it('navigates to the events tab and filters by the current data source index pattern', () => {
    const wrapper = shallow(<ComplianceSubrequirements {...baseProps()} />);
    wrapper.instance().openDiscover({}, '1.1');

    expect(mockAddFilters).toHaveBeenCalledWith([
      expect.objectContaining({
        meta: expect.objectContaining({ index: 'test-index-pattern' }),
      }),
    ]);
    expect(mockUpdateAndNavigateSearchParams).toHaveBeenCalledWith({
      tabSubView: 'findings',
    });
  });
});

describe('ComplianceSubrequirements - hover icons on scroll', () => {
  const propsWithOneRequirement = () => ({
    ...baseProps(),
    complianceObject: { '1.1': ['1.1'] },
    descriptions: { '1.1': 'Some requirement' },
    selectedRequirements: { '1.1': true },
  });

  it('clears the hovered tile (closing its icons and any open tooltip) when the requirements grid scrolls', () => {
    const wrapper = shallow(
      <ComplianceSubrequirements {...propsWithOneRequirement()} />,
    );
    wrapper.instance().setState({ hover: '1.1' });
    wrapper.update();
    expect(wrapper.state('hover')).toBe('1.1');

    wrapper.find(EuiFlexGrid).simulate('scroll');
    wrapper.update();
    expect(wrapper.state('hover')).toBe('');
  });

  it('does not throw when scrolling while no tile is hovered', () => {
    const wrapper = shallow(
      <ComplianceSubrequirements {...propsWithOneRequirement()} />,
    );
    expect(() => wrapper.find(EuiFlexGrid).simulate('scroll')).not.toThrow();
  });
});
