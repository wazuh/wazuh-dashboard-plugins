import { EuiComboBox, EuiComboBoxOptionOption, EuiHighlight, EuiText } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { getMasterNode, parseNodeIPs } from '../utils';

type Props = {
  onChange: (value: string) => void;
  fetchOptions: () => Promise<EuiComboBoxOptionOption<string>[]>;
};

export type ServerAddressOptions = EuiComboBoxOptionOption<any> & { nodetype?: string };

export default function ServerAddress(props: Props) {
  const { onChange, fetchOptions } = props;
  const [nodeIPs, setNodeIPs] = useState<ServerAddressOptions[]>([]);
  const [selectedNodeIPs, setSelectedNodeIPs] = useState<ServerAddressOptions[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  /**
   * Fetches the node IPs (options) and sets the state
   */
  const initialize = async () => {
    if(!fetchOptions){
      throw new Error('fetchOptions is required');
    }
    try {
      setIsLoading(true);
      const nodeIps = await fetchOptions();
      setNodeIPs(nodeIps);
      const defaultNode = getMasterNode(nodeIps);
      if (defaultNode.length > 0){
        handleOnChange(defaultNode);
      }
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw new Error(`Error initializing Server Address: ${error}`);
    }
  };

  /**
   * Handles the change of the selected node IP
   * @param value
   */
  const handleOnChange = (value) => {
    setSelectedNodeIPs(value);
    onChange(value);
  };

  /**
   * Handle the render of the custom options in the combobox list
   * @param option
   * @param searchValue
   * @param contentClassName
   */
  const handleRenderOption = (option, inputValue, contentClassName) => {
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
  const handleOnCreateOption = (inputValue, options: any[] = []) => {
    if (!inputValue){
      return;
    }

    const normalizedSearchValue = inputValue.trim().toLowerCase();
    if (!normalizedSearchValue) {
      return;
    }

    const newOption = { value: inputValue, label: inputValue };
    // Create the option if it doesn't exist.
    if (
      options.findIndex((option) => option.label.trim().toLowerCase() === normalizedSearchValue) ===
      -1
    ) {
      setNodeIPs([...nodeIPs, newOption]);
    }
    // Select the option.
    handleOnChange([...selectedNodeIPs, newOption]);
  };

  return (
    <EuiText>
      <p>
        This is the address the agent uses to communicate with the Wazuh server. It can be a list of one or 
        more IP addresses or fully qualified domain names (FQDN).
      </p>
      <EuiComboBox
        placeholder="Server Address"
        isLoading={isLoading}
        selectedOptions={selectedNodeIPs}
        options={nodeIPs}
        onChange={handleOnChange}
        renderOption={handleRenderOption}
        data-test-subj="demoComboBox"
        onCreateOption={(sv, fo) => handleOnCreateOption(sv, fo)}
      />
    </EuiText>
  );
}
