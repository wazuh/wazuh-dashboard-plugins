/*
 * Wazuh app - React component for main overview - Test
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
import { mount, shallow } from 'enzyme';
import { OverviewStats } from './overview-stats';
import { AgentsSummary } from '../../common/hooks/types';
import { findTestSubject } from '@elastic/eui/lib/test';

describe('Overview stats', () => {
  test('should render a Overview stats screen', () => {
    const summaryMock: AgentsSummary = {
      total: 0,
      active: 0,
      disconnected: 0,
      never_connected: 0,
    };
    const component = shallow(<OverviewStats summary={summaryMock} />);

    expect(component).toMatchSnapshot();
  });

  test('should render agents values with -', () => {
    const summaryMock: AgentsSummary = {
      total: 0,
      active: 0,
      disconnected: 0,
      never_connected: 0,
    };
    const component = mount(<OverviewStats summary={summaryMock} />);
    const totalAgents = findTestSubject(component, 'spanTotalAgents');
    expect(totalAgents.text()).toBe('-');
    const activeAgents = findTestSubject(component, 'spanActiveAgents');
    expect(activeAgents.text()).toBe('-');
    const disconnectedAgents = findTestSubject(component, 'spanDisconnectedAgents');
    expect(disconnectedAgents.text()).toBe('-');
    const neverConnectedAgents = findTestSubject(component, 'spanNeverConnectedAgents');
    expect(neverConnectedAgents.text()).toBe('-');
  });

  test('should render agents values with correct values', () => {
    const summaryMock: AgentsSummary = {
      total: 6,
      active: 3,
      disconnected: 2,
      never_connected: 1,
    };
    const component = mount(<OverviewStats summary={summaryMock} />);
    const totalAgents = findTestSubject(component, 'spanTotalAgents');
    expect(totalAgents.text()).toBe('6');
    const activeAgents = findTestSubject(component, 'spanActiveAgents');
    expect(activeAgents.text()).toBe('3');
    const disconnectedAgents = findTestSubject(component, 'spanDisconnectedAgents');
    expect(disconnectedAgents.text()).toBe('2');
    const neverConnectedAgents = findTestSubject(component, 'spanNeverConnectedAgents');
    expect(neverConnectedAgents.text()).toBe('1');
  });
});
