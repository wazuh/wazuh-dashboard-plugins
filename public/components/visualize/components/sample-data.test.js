import { SampleData } from './sample-data';
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
    const wrapper = await mount(<SampleData />);
    await awaitForMyComponent(wrapper);
    expect(wrapper.find('EuiCallOut').exists());
  });

  it('should not render if there is no sample data', async () => {
    WzRequest.genericReq.mockResolvedValue({ data: { sampleAlertsInstalled: false } });
    const wrapper = await mount(<SampleData />);
    await awaitForMyComponent(wrapper);
    expect(wrapper.contains('EuiCallOut')).toBe(false);
  });

  it('should call the orchestrator upon error', async () => {
    const context = 'testComponent';
    const error = {
      message: 'This is a test',
      name: 'This should not be the thing',
    };
    const mockOptions = {
      context,
      level: UI_LOGGER_LEVELS.ERROR,
      severity: UI_ERROR_SEVERITIES.UI,
      error: {
        error: error,
        message: error.message || error,
        title: error.name || error,
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
    const wrapper = await mount(<SampleData context={context} />);
    await awaitForMyComponent(wrapper);
  });
});
