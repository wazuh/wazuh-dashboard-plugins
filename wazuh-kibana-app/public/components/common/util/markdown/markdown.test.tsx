  
/*
 * Wazuh app - Markdown Component - Test
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
import { Markdown } from './markdown';

describe('Markdown container', () => {
  test('should render the component', () => {
    const component = shallow(<Markdown markdown={'Example text'}/>);
    expect(component).toMatchSnapshot();
  });

  test('should render a link', () => {
    const component = shallow(<Markdown markdown={`[label](https://example.com)`}/>);
    expect(component.html().includes('<a href="https://example.com" target="_blank">label</a>')).toBe(true);
  });
});
