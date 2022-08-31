/*
 * Wazuh app - React test for table default component.
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
import { mount } from 'enzyme';
import { RenderBodyModal } from '../render-body-modal';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

const restartingState = {
  nodos: [
    { node: 'nodo-master', isRestarted: true },
    { node: 'worker1', isRestarted: true },
    { node: 'worker2', isRestarted: false },
  ],

  statusRestart: 'restarting',
};
const restartedInfoState = {
  nodos: [
    { node: 'nodo-master', isRestarted: true },
    { node: 'worker1', isRestarted: true },
    { node: 'worker2', isRestarted: true },
  ],

  statusRestart: 'restarted_info',
};
const restartErrorState = {
  nodos: [
    { node: 'nodo-master', isRestarted: true },
    { node: 'worker1', isRestarted: true },
    { node: 'worker2', isRestarted: false },
  ],

  statusRestart: 'restart_error',
};
const syncingState = {
  nodos: [
    { node: 'nodo-master', synced: true },
    { node: 'worker1', synced: false },
    { node: 'worker2', synced: false },
  ],
  statusRestart: 'syncing',
};
const syncErrorState = {
  nodos: [
    { node: 'nodo-master', synced: true },
    { node: 'worker1', synced: false },
    { node: 'worker2', synced: false },
  ],

  statusRestart: 'sync_error',
};
const mockStore = configureMockStore();

describe('Restart status: restarting', () => {
  it('renders correctly to match the snapshot.', () => {
    const store = mockStore(restartingState);

    const wrapper = mount(
      <Provider store={store}>
        <RenderBodyModal
          nodos={restartingState.nodos}
          statusRestart={restartingState.statusRestart}
        />
        ;
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
});

describe('Restart status: restarted_info', () => {
  it('renders correctly to match the snapshot.', () => {
    const store = mockStore(restartedInfoState);

    const wrapper = mount(
      <Provider store={store}>
        <RenderBodyModal
          nodos={restartedInfoState.nodos}
          statusRestart={restartedInfoState.statusRestart}
        />
        ;
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
});

describe('Restart status: restart_error', () => {
  it('renders correctly to match the snapshot.', () => {
    const store = mockStore(restartErrorState);

    const wrapper = mount(
      <Provider store={store}>
        <RenderBodyModal
          nodos={restartErrorState.nodos}
          statusRestart={restartErrorState.statusRestart}
        />
        ;
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
});

describe('Restart status: sync_error', () => {
  it('renders correctly to match the snapshot.', () => {
    const store = mockStore(syncErrorState);

    const wrapper = mount(
      <Provider store={store}>
        <RenderBodyModal
          nodos={syncErrorState.nodos}
          statusRestart={syncErrorState.statusRestart}
        />
        ;
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
});

describe('Restart status: syncing', () => {
  it('renders correctly to match the snapshot.', () => {
    const store = mockStore(syncingState);

    const wrapper = mount(
      <Provider store={store}>
        <RenderBodyModal nodos={syncingState.nodos} statusRestart={syncingState.statusRestart} />
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
