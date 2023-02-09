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
import { RestartModal } from '../restart-modal';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';

jest.mock('../../../../redux/reducers/restartReducers', () => ({
  unsynchronizedNodes: state => state,
  restartStatus: state => state,
  syncNodesInfo: state => state,
  restartNodesInfo: state => state,
}));
jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: options => {},
  }),
}));

const restartedState = {
  restartWazuhReducers: {
    unsynchronizedNodes: [],
    syncNodesInfo: [{ name: '', synced: false }],
    restartNodesInfo: [{ node: '', isRestarted: false }],
    restartStatus: 'restarted',
  },
  rulesetReducers: {
    section: 'rules',
  },
};
const restartingState = {
  restartWazuhReducers: {
    unsynchronizedNodes: [],
    syncNodesInfo: [{ name: '', synced: false }],
    restartNodesInfo: [
      { node: 'nodo-master', isRestarted: false },
      { node: 'worker1', isRestarted: false },
      { node: 'worker2', isRestarted: false },
    ],
    restartStatus: 'restarting',
  },
  rulesetReducers: {
    section: 'rules',
  },
};
const restartedInfoState = {
  restartWazuhReducers: {
    unsynchronizedNodes: [],
    syncNodesInfo: [{ name: '', synced: false }],
    restartNodesInfo: [
      { node: 'nodo-master', isRestarted: true },
      { node: 'worker1', isRestarted: true },
      { node: 'worker2', isRestarted: true },
    ],
    restartStatus: 'restarted_info',
  },
  rulesetReducers: {
    section: 'rules',
  },
};
const restartErrorState = {
  restartWazuhReducers: {
    unsynchronizedNodes: [],
    syncNodesInfo: [{ name: '', synced: false }],
    restartNodesInfo: [
      { node: 'nodo-master', isRestarted: true },
      { node: 'worker1', isRestarted: true },
      { node: 'worker2', isRestarted: false },
    ],
    restartStatus: 'restart_error',
  },
  rulesetReducers: {
    section: 'rules',
  },
};
const syncingState = {
  restartWazuhReducers: {
    unsynchronizedNodes: [],
    syncNodesInfo: [
      { node: 'nodo-master', synced: true },
      { node: 'worker1', synced: false },
      { node: 'worker2', synced: false },
    ],
    restartNodesInfo: [{ node: '', isRestarted: false }],
    restartStatus: 'syncing',
  },
  rulesetReducers: {
    section: 'rules',
  },
};
const syncErrorState = {
  restartWazuhReducers: {
    unsynchronizedNodes: [],
    syncNodesInfo: [
      { node: 'nodo-master', synced: true },
      { node: 'worker1', synced: false },
      { node: 'worker2', synced: false },
    ],
    restartNodesInfo: [{ node: '', isRestarted: false }],
    restartStatus: 'sync_error',
  },
  rulesetReducers: {
    section: 'rules',
  },
};
const mockStore = configureMockStore();

describe('Restart status: restarted', () => {
  it('renders correctly to match the snapshot.', () => {
    const store = mockStore(restartedState);

    const wrapper = mount(
      <Provider store={store}>
        <RestartModal />;
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});

describe('Restart status: restarting', () => {
  it('renders correctly to match the snapshot.', () => {
    const store = mockStore(restartingState);

    const wrapper = mount(
      <Provider store={store}>
        <RestartModal />;
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });
});

describe('Restart status: restarted_info', () => {
  it('renders correctly to match the snapshot.', () => {
    const store = mockStore(restartedInfoState);

    const wrapper = mount(
      <Provider store={store}>
        <RestartModal />;
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('clicking on the cancel button works', () => {
    const store = mockStore(restartedInfoState);
    const cancelModal = jest.fn();

    const wrapper = mount(
      <Provider store={store}>
        <RestartModal
          isSyncCanceled={{ isSyncCanceled: false }}
          cancelSync={cancelModal}
        />
      </Provider>,
    );

    const buttonCancel = wrapper.find('EuiButton');

    expect(buttonCancel.text().trim()).toContain('Aceptar');
    buttonCancel.props().onClick = cancelModal;
    buttonCancel.simulate('click');
    expect(cancelModal).toHaveBeenCalled();
  });
});

describe('Restart status: restart_error', () => {
  it('renders correctly to match the snapshot.', () => {
    const store = mockStore(restartErrorState);

    const wrapper = mount(
      <Provider store={store}>
        <RestartModal />;
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('force restart must be enabled', async () => {
    const store = mockStore(restartErrorState);
    const goToHealthcheckHref = '#/health-check';

    const wrapper = mount(
      <Provider store={store}>
        <RestartModal />
      </Provider>,
    );

    const goToHealthcheckButton = wrapper.find('EuiButton').at(1);

    expect(goToHealthcheckButton.props().href).toBe(goToHealthcheckHref);
    expect(goToHealthcheckButton.text().trim()).toContain('Go to Healthcheck');
  });
});

describe('Restart status: sync_error', () => {
  it('renders correctly to match the snapshot.', () => {
    const store = mockStore(syncErrorState);

    const wrapper = mount(
      <Provider store={store}>
        <RestartModal />;
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('force restart must be enabled', async () => {
    const store = mockStore(syncErrorState);
    const forceRestart = jest.fn();
    const cancelModal = jest.fn();

    const wrapper = mount(
      <Provider store={store}>
        <RestartModal
          isSyncCanceled={{ isSyncCanceled: false }}
          cancelSync={cancelModal}
        />
      </Provider>,
    );

    const buttonForceRestart = wrapper.find('EuiButtonEmpty');
    buttonForceRestart.props().onClick = forceRestart;
    buttonForceRestart.simulate('click');
    expect(buttonForceRestart.text().trim()).toContain('Force restart');
    expect(buttonForceRestart.props().disabled).toBeUndefined();
  });

  it('clicking on the cancel button works', () => {
    const store = mockStore(syncErrorState);
    const cancelModal = jest.fn();

    const wrapper = mount(
      <Provider store={store}>
        <RestartModal
          isSyncCanceled={{ isSyncCanceled: false }}
          cancelSync={cancelModal}
        />
      </Provider>,
    );

    const buttonCancel = wrapper.find('EuiButton');

    expect(buttonCancel.text().trim()).toContain('Cancel');
    buttonCancel.props().onClick = cancelModal;
    buttonCancel.simulate('click');
    expect(cancelModal).toHaveBeenCalled();
  });
});

describe('Restart status: syncing', () => {
  it('renders correctly to match the snapshot.', () => {
    const store = mockStore(syncingState);
    const cancelModal = jest.fn();

    const wrapper = mount(
      <Provider store={store}>
        <RestartModal
          isSyncCanceled={{ isSyncCanceled: false }}
          cancelSync={cancelModal}
        />
      </Provider>,
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('force restart must be disabled', () => {
    const store = mockStore(syncingState);
    const cancelModal = jest.fn();

    const wrapper = mount(
      <Provider store={store}>
        <RestartModal
          isSyncCanceled={{ isSyncCanceled: false }}
          cancelSync={cancelModal}
        />
      </Provider>,
    );

    const buttonForceRestart = wrapper.find('EuiButtonEmpty');

    expect(buttonForceRestart.text().trim()).toContain('Force restart');
    expect(buttonForceRestart.props().disabled).toBeTruthy();
  });

  it('clicking on the cancel button works', () => {
    const store = mockStore(syncingState);
    const cancelModal = jest.fn();

    const wrapper = mount(
      <Provider store={store}>
        <RestartModal
          isSyncCanceled={{ isSyncCanceled: false }}
          cancelSync={cancelModal}
        />
      </Provider>,
    );

    const buttonCancel = wrapper.find('EuiButton');

    expect(buttonCancel.text().trim()).toContain('Cancel');
    buttonCancel.props().onClick = cancelModal;
    buttonCancel.simulate('click');
    expect(cancelModal).toHaveBeenCalled();
  });
});
