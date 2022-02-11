/*
 * Wazuh app - React test for FieldForm component.
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
import { FieldForm } from './field-form';
import { ISetting } from '../../../../../configuration';
import { mount } from 'enzyme';

describe('FieldForm component', () => {
  it('renders correctly to match the snapshot', () => {
    const item: ISetting = {
      setting: 'string',
      value: 'boolean',
      description: 'string',
      category: 'string',
      name: 'string',
      form: { type: 'text', params: {} }
    };
    const updatedConfig = {};
    const setUpdatedConfig = jest.fn();

    const wrapper = mount(
      <FieldForm item={item} updatedConfig={updatedConfig} setUpdatedConfig={setUpdatedConfig} />
    );

    expect(wrapper).toMatchSnapshot();
  });
});
