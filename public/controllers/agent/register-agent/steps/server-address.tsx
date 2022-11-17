import {
  EuiComboBox,
  EuiComboBoxOptionOption,
  EuiHighlight,
  EuiText,
} from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getMasterNode } from '../../components/register-agent-service';

type Props = {
  onChange: (value: EuiComboBoxOptionOption<ServerAddressOptions>[]) => void;
  fetchOptions: () => Promise<EuiComboBoxOptionOption<ServerAddressOptions>[]>;
  defaultValue?: string;
};

export type ServerAddressOptions = EuiComboBoxOptionOption<any> & {
  nodetype?: string;
};

const ServerAddress = (props: Props) => {
  const { onChange, fetchOptions, defaultValue } = props;
  const [nodeIPs, setNodeIPs] = useState<ServerAddressOptions[]>([]);
  const [selectedNodeIPs, setSelectedNodeIPs] = useState<
    ServerAddressOptions[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  /**
   * Fetches the node IPs (options) and sets the state
   */
  const initialize = async () => {
    if (!fetchOptions) {
      throw new Error('fetchOptions is required');
    }
    try {
      setIsLoading(true);
      await setDefaultValue();
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      const options = {
        context: `${ServerAddress.name}.initialize`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        display: true,
        store: false,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  };

  /**
   * Sets the default value of server address
   */
  const setDefaultValue = async () => {
    if (defaultValue) {
      const defaultNode = [{ label: defaultValue, value: defaultValue, nodetype: 'custom' }];
      handleOnChange(defaultNode);
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
      const nodeIps = await fetchOptions();
      setNodeIPs(nodeIps);
      const defaultNode = getMasterNode(nodeIps);
      if (defaultNode.length > 0) {
        handleOnChange(defaultNode);
      }
    }
  };

  /**
   * Handles the change of the selected node IP
   * @param value
   */
  const handleOnChange = (value: EuiComboBoxOptionOption<any>[]) => {
    setSelectedNodeIPs(value);
    onChange(value);
  };

  /**
   * Handle the render of the custom options in the combobox list
   * @param option
   * @param searchValue
   * @param contentClassName
   */
  const handleRenderOption = (
    option: EuiComboBoxOptionOption<any>,
    inputValue: string,
    contentClassName: string,
  ) => {
    const { label, value } = option;
    return (
      <span className={contentClassName}>
        <EuiHighlight search={inputValue}>{`${label}:${value}`}</EuiHighlight>
      </span>
    );
  };

  /**
   * Handle the interaction when the user enter a option that is not in the list
   * Creating new options in the list and selecting it
   * @param inputValue
   * @param options
   */
  const handleOnCreateOption = (
    inputValue: string,
    options: ServerAddressOptions[] = [],
  ) => {
    if (!inputValue) {
      return;
    }

    const normalizedSearchValue = inputValue.trim().toLowerCase();
    if (!normalizedSearchValue) {
      return;
    }

    const newOption = {
      value: inputValue,
      label: inputValue,
      nodetype: 'custom',
    };
    // Create the option if it doesn't exist.
    if (
      options.findIndex(
        (option: ServerAddressOptions) =>
          option.label.trim().toLowerCase() === normalizedSearchValue,
      ) === -1
    ) {
      setNodeIPs([...nodeIPs, newOption]);
    }
    // Select the option.
    handleOnChange([newOption]);
  };

  return (
    <EuiText>
      <p>
        This is the address the agent uses to communicate with the Wazuh server. It can be an IP address or a fully qualified domain name (FQDN).
      </p>
      <EuiComboBox
        placeholder='Server Address'
        singleSelection={true}
        isLoading={isLoading}
        selectedOptions={selectedNodeIPs}
        options={nodeIPs}
        onChange={handleOnChange}
        renderOption={handleRenderOption}
        data-test-subj='demoComboBox'
        isDisabled={isDisabled}
        onCreateOption={(sv, fo) => handleOnCreateOption(sv, fo)}
      />
    </EuiText>
  );
};

export default ServerAddress;
