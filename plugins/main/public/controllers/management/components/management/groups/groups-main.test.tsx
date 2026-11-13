/*
 * Wazuh app - React test for Group-Main component.
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
import WzGroups, { WzGroups as WzGroupsClass } from './groups-main';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import NavigationService from '../../../../../react-services/navigation-service';
import { getGroupConfigurationFile } from './utils/group-configuration';

jest.mock('./utils/group-configuration', () => ({
  ...jest.requireActual('./utils/group-configuration'),
  getGroupConfigurationFile: jest.fn(),
}));

jest.mock('../../../../../kibana-services', () => ({
  getHttp: () => ({
    basePath: {
      prepend: str => str,
    },
  }),
  getCookies: () => {
    return {
      get: () => 'test',
    };
  },
}));

const mockProps = {
  section: 'groups',
  configurationProps: {
    agent: {
      id: '001',
    },
  },
  state: {
    section: '',
  },
};
const mockStore = configureMockStore();
const store = mockStore({});

describe('Group main component', () => {
  it('renders correctly to match the snapshot', () => {
    const wrapper = shallow(
      <Provider store={store}>
        <WzGroups {...mockProps} />
      </Provider>,
    );

    expect(wrapper).toMatchSnapshot();
  });
});

describe('Group main component navigation', () => {
  const buildInstance = (search: { group?: string }) => {
    const props = {
      search,
      state: {},
      cleanFileContent: jest.fn(),
      updateGroupDetail: jest.fn(),
    };
    const instance = new WzGroupsClass(props);
    instance.getGroupDetail = jest.fn();
    return { instance, props };
  };

  it('closes the file editor and the group detail when the group is removed from the URL', async () => {
    const { instance, props } = buildInstance({});

    await instance.componentDidUpdate({ search: { group: 'default' } });

    expect(props.cleanFileContent).toHaveBeenCalledTimes(1);
    expect(props.updateGroupDetail).toHaveBeenCalledWith(false);
  });

  it('keeps the file editor when the group does not change', async () => {
    const { instance, props } = buildInstance({ group: 'default' });

    await instance.componentDidUpdate({ search: { group: 'default' } });

    expect(props.cleanFileContent).not.toHaveBeenCalled();
    expect(instance.getGroupDetail).not.toHaveBeenCalled();
  });
});

describe('Group main component discard confirmation', () => {
  const buildInstance = () => {
    const props = {
      search: {},
      state: { showDiscardChangesModal: true },
      updateShowDiscardChangesModal: jest.fn(),
    };
    return { instance: new WzGroupsClass(props), props };
  };

  it('closes the confirmation and leaves the group when confirmed', () => {
    const updateAndNavigateSearchParams = jest.fn();
    jest.spyOn(NavigationService, 'getInstance').mockReturnValue({
      updateAndNavigateSearchParams,
    } as unknown as NavigationService);
    const { instance, props } = buildInstance();

    instance.confirmDiscard();

    expect(props.updateShowDiscardChangesModal).toHaveBeenCalledWith(false);
    expect(updateAndNavigateSearchParams).toHaveBeenCalledWith({ group: null });
  });

  it('only closes the confirmation when cancelled', () => {
    const updateAndNavigateSearchParams = jest.fn();
    jest.spyOn(NavigationService, 'getInstance').mockReturnValue({
      updateAndNavigateSearchParams,
    } as unknown as NavigationService);
    const { instance, props } = buildInstance();

    instance.closeDiscardModal();

    expect(props.updateShowDiscardChangesModal).toHaveBeenCalledWith(false);
    expect(updateAndNavigateSearchParams).not.toHaveBeenCalled();
  });
});

describe('Group main component editor opened from the URL', () => {
  const file = {
    name: 'agent.conf',
    content: '<agent_config></agent_config>',
    isEditable: true,
    groupName: 'default',
  };
  let updateAndNavigateSearchParams: jest.Mock;

  const buildInstance = (
    search: { group?: string; editConfig?: string },
    groupDetail: { name: string } | null = { name: 'default' },
  ) => {
    const props = {
      search,
      state: {},
      cleanFileContent: jest.fn(),
      updateGroupDetail: jest.fn(),
      updateFileContent: jest.fn(),
    };
    const instance = new WzGroupsClass(props);
    instance.getGroupDetail = jest.fn().mockResolvedValue(groupDetail);
    return { instance, props };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getGroupConfigurationFile as jest.Mock).mockResolvedValue(file);
    updateAndNavigateSearchParams = jest.fn();
    jest.spyOn(NavigationService, 'getInstance').mockReturnValue({
      updateAndNavigateSearchParams,
    } as unknown as NavigationService);
  });

  it('opens the configuration editor of the group and drops the request from the URL', async () => {
    const { instance, props } = buildInstance({
      group: 'default',
      editConfig: 'true',
    });

    await instance.componentDidMount();

    expect(getGroupConfigurationFile).toHaveBeenCalledWith('default');
    expect(props.updateFileContent).toHaveBeenCalledWith(file);
    expect(updateAndNavigateSearchParams).toHaveBeenCalledWith(
      { editConfig: null },
      { replace: true },
    );
  });

  it('only shows the group when the editor is not requested', async () => {
    const { instance, props } = buildInstance({ group: 'default' });

    await instance.componentDidMount();

    expect(instance.getGroupDetail).toHaveBeenCalled();
    expect(getGroupConfigurationFile).not.toHaveBeenCalled();
    expect(props.updateFileContent).not.toHaveBeenCalled();
  });

  it("doesn't open the editor of a group that can't be read", async () => {
    const { instance, props } = buildInstance(
      { group: 'missing', editConfig: 'true' },
      null,
    );

    await instance.componentDidMount();

    expect(getGroupConfigurationFile).not.toHaveBeenCalled();
    expect(props.updateFileContent).not.toHaveBeenCalled();
  });

  it("doesn't open the editor when its file can't be read", async () => {
    (getGroupConfigurationFile as jest.Mock).mockResolvedValue(null);
    const { instance, props } = buildInstance({
      group: 'default',
      editConfig: 'true',
    });

    await instance.componentDidMount();

    expect(props.updateFileContent).not.toHaveBeenCalled();
  });

  it('opens the editor when it is requested for the group already shown', async () => {
    const { instance, props } = buildInstance({
      group: 'default',
      editConfig: 'true',
    });

    await instance.componentDidUpdate({ search: { group: 'default' } });

    expect(props.updateFileContent).toHaveBeenCalledWith(file);
  });
});
