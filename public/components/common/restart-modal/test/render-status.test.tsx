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
import { RenderStatus } from '../render-status';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

const restartingState = {
  node: { node: 'nodo-master', isRestarted: false },

  statusRestart: 'restarting',
};
const restartedInfoState = {
  node: { node: 'nodo-master', isRestarted: true },

  statusRestart: 'restarted_info',
};
const restartErrorState = {
  node: { node: 'nodo-master', isRestarted: true },

  statusRestart: 'restart_error',
};
const syncingState = {
  node: { node: 'nodo-master', synced: true },
  statusRestart: 'syncing',
};
const syncErrorState = {
  node: { node: 'nodo-master', synced: true },

  statusRestart: 'sync_error',
};
const mockStore = configureMockStore();

describe('Restart status: restarting', () => {
  it('renders correctly to match the snapshot.', () => {
    const store = mockStore(restartingState);

    const wrapper = mount(
      <Provider store={store}>
        <RenderStatus node={restartingState.node} statusRestart={restartingState.statusRestart} />;
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
        <RenderStatus
          node={restartedInfoState.node}
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
        <RenderStatus
          node={restartErrorState.node}
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
        <RenderStatus node={syncErrorState.node} statusRestart={syncErrorState.statusRestart} />;
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
});

describe('Restart status: syncing', () => {
  it('renders correctly to match the snapshot.', () => {
    const store = mockStore(syncingState);
    const cancelModal = jest.fn();

    const wrapper = mount(
      <Provider store={store}>
        <RenderStatus node={syncingState.node} statusRestart={syncingState.statusRestart} />
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });
});
