import React from 'react';
import { render, act } from '@testing-library/react';
import OutdatedAgentsCard from './outdated-agents-card';
import '@testing-library/jest-dom/extend-expect';
import { mount } from 'enzyme';
import { EuiButtonEmpty, EuiLink } from '@elastic/eui';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';

jest.mock('../../../common/hooks/use-service', () => ({
  __esModule: true,
  useService: jest.fn(),
}));

describe('OutdatedAgentsCard', () => {
  const awaitForMyComponent = async (wrapper: any) => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      wrapper.update();
    });
  };

  const mockLoading = false;
  const mockDataNoOutdatedAgents = [];
  const useServiceMockNoOutdatedAgent = jest.fn(() => ({data: mockDataNoOutdatedAgents, isLoading: mockLoading}));
  const mockDataOutdatedAgents = [
    {
        version: "Wazuh v3.0.0",
        id: "003",
        name: "main_database"
    },
    {
        version: "Wazuh v3.0.0",
        id: "004",
        name: "dmz002"
    }
];
  const useServiceMockOutdatedAgent = jest.fn(() => ({data: mockDataOutdatedAgents, isLoading: mockLoading}));
  
  const handleClick = jest.fn();

  it('renders with not outdated agents', async () => {
    require('../../../common/hooks/use-service').useService = useServiceMockNoOutdatedAgent;  
    
    await act(async () => {
      const { getByTestId } = render(
        <OutdatedAgentsCard onClick={handleClick} />
      );

      const outdatedAgentsNumberElement = getByTestId('wazuh-endpoints-summary-outdated-agents-number')
      expect(outdatedAgentsNumberElement).toHaveClass('euiTextColor euiTextColor--success');
      expect(outdatedAgentsNumberElement.textContent).toBe(`${mockDataNoOutdatedAgents.length}`);
    });
  });

  it('renders with outdated agents', async () => {
    require('../../../common/hooks/use-service').useService = useServiceMockOutdatedAgent;  
    
    await act(async () => {
      const { getByTestId } = render(
        <OutdatedAgentsCard onClick={handleClick} />
      );

      const outdatedAgentsNumberElement = getByTestId('wazuh-endpoints-summary-outdated-agents-number')
      expect(outdatedAgentsNumberElement).toHaveClass('euiTextColor euiTextColor--warning');
      expect(outdatedAgentsNumberElement.textContent).toBe(`${mockDataOutdatedAgents.length}`);
    });
  });

  it('renders popover on click with outdated agents', async () => {
    require('../../../common/hooks/use-service').useService = useServiceMockOutdatedAgent;
        
    const wrapper = await mount(
      <OutdatedAgentsCard onClick={handleClick} />,
    );

    await awaitForMyComponent(wrapper);
    
    expect(wrapper.find('.wazuh-outdated-agents-panel').exists()).toBeTruthy();
    expect(wrapper.find(EuiButtonEmpty).exists()).not.toBeTruthy();
    
    wrapper.find('.wazuh-outdated-agents-panel').simulate('click');
    expect(wrapper.find(EuiButtonEmpty).exists()).toBeTruthy();
  });

  it('handles click with correct data', async () => {
    require('../../../common/hooks/use-service').useService = useServiceMockOutdatedAgent;
        
    const wrapper = await mount(
      <OutdatedAgentsCard onClick={handleClick} />,
    );

    await awaitForMyComponent(wrapper);
    
    expect(wrapper.find('.wazuh-outdated-agents-panel').exists()).toBeTruthy();
    expect(wrapper.find(EuiButtonEmpty).exists()).not.toBeTruthy();
    
    wrapper.find('.wazuh-outdated-agents-panel').simulate('click');
    expect(wrapper.find(EuiButtonEmpty).exists()).toBeTruthy();

    wrapper.find(EuiButtonEmpty).simulate('click');
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockDataOutdatedAgents);
  });

  it('EuiButtonEmpty filter must be disabled when no data', async () => {
    require('../../../common/hooks/use-service').useService = useServiceMockNoOutdatedAgent;
        
    const wrapper = await mount(
      <OutdatedAgentsCard onClick={handleClick} />,
    );

    await awaitForMyComponent(wrapper);
    
    expect(wrapper.find('.wazuh-outdated-agents-panel').exists()).toBeTruthy();
    expect(wrapper.find(EuiButtonEmpty).exists()).not.toBeTruthy();
    
    wrapper.find('.wazuh-outdated-agents-panel').simulate('click');
    expect(wrapper.find(EuiButtonEmpty).exists()).toBeTruthy();
    expect(wrapper.find(EuiButtonEmpty).prop('isDisabled')).toBe(true);
  });

  it('check documentation link to update agents', async () => {
    const documentationLink = webDocumentationLink(
      'upgrade-guide/wazuh-agent/index.html',
    );
    require('../../../common/hooks/use-service').useService = useServiceMockNoOutdatedAgent;
        
    const wrapper = await mount(
      <OutdatedAgentsCard onClick={handleClick} />,
    );

    await awaitForMyComponent(wrapper);
    
    expect(wrapper.find('.wazuh-outdated-agents-panel').exists()).toBeTruthy();
    expect(wrapper.find(EuiButtonEmpty).exists()).not.toBeTruthy();
    
    wrapper.find('.wazuh-outdated-agents-panel').simulate('click');
    expect(wrapper.find(EuiLink).exists()).toBeTruthy();
    expect(wrapper.find(EuiLink).prop('href')).toBe(documentationLink);
  });

});
