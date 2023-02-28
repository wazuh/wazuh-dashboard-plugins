/*
 * Wazuh app - Testing suite for Visualize - Sample Data.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { SampleDataWarning } from './sample-data-warning';
import { WzRequest } from '../../../react-services';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import React from 'react';

const awaitForMyComponent = async (wrapper) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    wrapper.update();
  });
};
jest.mock('../../../react-services');
jest.mock('../../../react-services/common-services');
describe('Check sample data component', () => {
  it('should render if there is sample data', async () => {
    WzRequest.genericReq.mockResolvedValue({ data: { sampleAlertsInstalled: true } });
    const wrapper = await mount(<SampleDataWarning />);
    await awaitForMyComponent(wrapper);
    expect(wrapper.find('EuiCallOut').exists());
    expect(wrapper.find('EuiCallOut').props().title).toEqual("This dashboard contains sample data");
  });

  it('should not render if there is no sample data', async () => {
    WzRequest.genericReq.mockResolvedValue({ data: { sampleAlertsInstalled: false } });
    const wrapper = await mount(<SampleDataWarning />);
    await awaitForMyComponent(wrapper);
    expect(wrapper.contains('EuiCallOut')).toBe(false);
  });

  it('should call the orchestrator upon error', async () => {
    const error = {
      message: 'This is a test',
      name: 'This should not be the thing',
    };
    const mockOptions = {
      context: `${SampleDataWarning.name}.usesSampleData`,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.UI,
      error: {
        error: error,
        message: error.message,
        title: error.name,
      },
    };
    getErrorOrchestrator.mockImplementation(() => {
      return {
        handleError: (options) => {
          expect(options).toEqual(mockOptions);
        },
      };
    });
    WzRequest.genericReq.mockRejectedValue(error);
    const wrapper = await mount(<SampleDataWarning />);
    await awaitForMyComponent(wrapper);
  });
});
