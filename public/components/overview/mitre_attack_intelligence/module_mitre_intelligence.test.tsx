  
/*
 * Wazuh app - ModuleMitreAttackIntelligence Component - Test
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import React from 'react';
import { mount, shallow } from 'enzyme';
import { ModuleMitreIntelligence } from './module_mitre_intelligence';

jest.mock('../../../react-services', () => ({ 
  WzRequest: () => ({
    apiReq: (method: string, path: string, params: any) => {
      return {
        data: {
          data: {
            affected_items: []
          }
        }
      }
    }
  })
}));

describe('Module Mitre Att&ck intelligence container', () => {
  test('should render a the component', () => {
    const component = shallow(<ModuleMitreIntelligence />);

    expect(component).toMatchSnapshot();
  });

  // test('should render a Health check screen with error', () => {
  //   const component = mount(<HealthCheckTest />);

  //   component.find('CheckResult').at(1).invoke('handleErrors')('setup',['Test error']); // invoke is wrapped with act to await for setState

  //   const callOutError = component.find('EuiCallOut');
  //   expect(callOutError.text()).toBe('Test error');
  // });
});