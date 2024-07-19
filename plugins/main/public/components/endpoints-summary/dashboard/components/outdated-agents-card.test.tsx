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
  const filterByOutdatedAgent = jest.fn();

  it('renders with not outdated agents', async () => {
    await act(async () => {
      const { getByTestId } = render(
        <OutdatedAgentsCard
          isLoading={false}
          outdatedAgents={0}
          filterByOutdatedAgent={filterByOutdatedAgent}
        />,
      );

      const outdatedAgentsNumberElement = getByTestId(
        'wazuh-endpoints-summary-outdated-agents-number',
      );
      expect(outdatedAgentsNumberElement).toHaveClass(
        'euiTextColor euiTextColor--success',
      );
      expect(outdatedAgentsNumberElement.textContent).toBe('0');
    });
  });

  it('renders with outdated agents', async () => {
    await act(async () => {
      const { getByTestId } = render(
        <OutdatedAgentsCard
          isLoading={false}
          outdatedAgents={2}
          filterByOutdatedAgent={filterByOutdatedAgent}
        />,
      );

      const outdatedAgentsNumberElement = getByTestId(
        'wazuh-endpoints-summary-outdated-agents-number',
      );
      expect(outdatedAgentsNumberElement).toHaveClass(
        'euiTextColor euiTextColor--warning',
      );
      expect(outdatedAgentsNumberElement.textContent).toBe('2');
    });
  });

  it('renders popover on click with outdated agents', async () => {
    const wrapper = await mount(
      <OutdatedAgentsCard
        isLoading={false}
        outdatedAgents={2}
        filterByOutdatedAgent={filterByOutdatedAgent}
      />,
    );

    await awaitForMyComponent(wrapper);

    expect(wrapper.find('.wazuh-outdated-agents-panel').exists()).toBeTruthy();
    expect(wrapper.find(EuiButtonEmpty).exists()).not.toBeTruthy();

    wrapper.find('.wazuh-outdated-agents-panel').simulate('click');
    expect(wrapper.find(EuiButtonEmpty).exists()).toBeTruthy();
  });

  it('handles click with correct data', async () => {
    const wrapper = await mount(
      <OutdatedAgentsCard
        isLoading={false}
        outdatedAgents={2}
        filterByOutdatedAgent={filterByOutdatedAgent}
      />,
    );

    await awaitForMyComponent(wrapper);

    expect(wrapper.find('.wazuh-outdated-agents-panel').exists()).toBeTruthy();
    expect(wrapper.find(EuiButtonEmpty).exists()).not.toBeTruthy();

    wrapper.find('.wazuh-outdated-agents-panel').simulate('click');
    expect(wrapper.find(EuiButtonEmpty).exists()).toBeTruthy();

    wrapper.find(EuiButtonEmpty).simulate('click');
    expect(filterByOutdatedAgent).toHaveBeenCalledTimes(1);
    expect(filterByOutdatedAgent).toHaveBeenCalledWith(true);
  });

  it('EuiButtonEmpty filter must be disabled when no data', async () => {
    const wrapper = await mount(
      <OutdatedAgentsCard
        isLoading={false}
        outdatedAgents={0}
        filterByOutdatedAgent={filterByOutdatedAgent}
      />,
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
    const wrapper = await mount(
      <OutdatedAgentsCard
        isLoading={false}
        outdatedAgents={0}
        filterByOutdatedAgent={filterByOutdatedAgent}
      />,
    );

    await awaitForMyComponent(wrapper);

    expect(wrapper.find('.wazuh-outdated-agents-panel').exists()).toBeTruthy();
    expect(wrapper.find(EuiButtonEmpty).exists()).not.toBeTruthy();

    wrapper.find('.wazuh-outdated-agents-panel').simulate('click');
    expect(wrapper.find(EuiLink).exists()).toBeTruthy();
    expect(wrapper.find(EuiLink).prop('href')).toBe(documentationLink);
  });
});
