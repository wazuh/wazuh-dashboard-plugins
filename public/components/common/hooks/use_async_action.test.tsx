/*
 * Wazuh app - Test for React hook for build async action runners
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
import { mount } from 'enzyme';
import { useAsyncAction } from './use_async_action';

const sleep = (miliseconds: number) => new Promise((res) => setTimeout(res, miliseconds));

const NO_DATA = 'no data';
const RESPONSE_SUCCESS = 'Example data';
const RESPOSE_ERROR = 'Example error';

const TestComponent = ({ action }) => {
  const { data, error, running, run } = useAsyncAction(action, []);

  return (
    <div>
      <button onClick={run}></button>
      <div id="running">{String(running)}</div>
      <div id="data">{data || NO_DATA}</div>
      <div id="error">{String(error)}</div>
    </div>
  );
};

describe('useAsyncAction hook', () => {
  it('should run the asynchronous action and display the data', async () => {
    const component = mount(
      <TestComponent
        action={async () => {
          await sleep(500);
          return RESPONSE_SUCCESS;
        }}
      />
    );

    expect(component.find('#running').text()).toBe('false');
    expect(component.find('#data').text()).toBe(NO_DATA);
    expect(component.find('#error').text()).toBe('null');

    await sleep(200);
    component.find('button').simulate('click');

    await sleep(100);
    expect(component.find('#running').text()).toBe('true');

    await sleep(550);
    expect(component.find('#running').text()).toBe('false');
    expect(component.find('#data').text()).toBe(RESPONSE_SUCCESS);
  });

  it('should run the asynchronous action and display an error', async () => {
    const component = mount(
      <TestComponent
        action={async () => {
          await sleep(500);
          throw RESPOSE_ERROR;
          return RESPONSE_SUCCESS;
        }}
      />
    );
    expect(component.find('#running').text()).toBe('false');
    expect(component.find('#data').text()).toBe(NO_DATA);
    expect(component.find('#error').text()).toBe('null');

    await sleep(200);
    component.find('button').simulate('click');

    await sleep(100);
    expect(component.find('#running').text()).toBe('true');

    await sleep(550);
    expect(component.find('#running').text()).toBe('false');
    expect(component.find('#data').text()).toBe('no data');
    expect(component.find('#error').text()).toBe(RESPOSE_ERROR);
  });
});
