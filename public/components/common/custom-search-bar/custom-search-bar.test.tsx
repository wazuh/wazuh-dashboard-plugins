  
/*
 * Wazuh app - Custom Search Bar Component - Test
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
import { CustomSearchBar } from '../custom-search-bar';

describe('Search Bar container', () => {
    const mock = [{
        type: 'combobox',
        key: 'agent.name',
        values: [
            {
            key: 'agent.name',
            label: 'Amazon',
            },
            {
            key: 'agent.name',
            label: 'Centos',
            }
        ],
    },]

  test('should render the component', () => {
    const component = shallow(<CustomSearchBar filtersValues={mock}/>);

    expect(component).toMatchSnapshot();
  });
});
