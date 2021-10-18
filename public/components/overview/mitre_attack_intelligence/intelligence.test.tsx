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
import { shallow } from 'enzyme';
import { ModuleMitreAttackIntelligence } from './intelligence';

jest.mock('../../../react-services', () => ({
  WzRequest: () => ({
    apiReq: (method: string, path: string, params: any) => {
      return {
        data: {
          data: {
            affected_items: [],
          },
        },
      };
    },
  }),
}));

describe('Module Mitre Att&ck intelligence container', () => {
  it('should render the component', () => {
    const component = shallow(<ModuleMitreAttackIntelligence />);

    expect(component).toMatchSnapshot();
  });
});
