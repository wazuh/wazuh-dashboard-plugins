import { EuiComboBox, EuiComboBoxOptionOption, EuiHealth, EuiHighlight, euiPaletteColorBlind, euiPaletteColorBlindBehindText, EuiText } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { getNodeIPs, parseNodeIPs } from '../utils';

type Props = {
  onChange: (value: string) => void;
};

type ServerAddressOptions = EuiComboBoxOptionOption<any> & { nodeType?: string };

export default function ServerAddress(props: Props) {
  const { onChange } = props;
  const [nodeIPs, setNodeIPs] = useState<ServerAddressOptions[]>([]);
  const [selectedNodeIPs, setSelectedNodeIPs] = useState<ServerAddressOptions[]>([]);


  const visColors = euiPaletteColorBlind();
  const visColorsBehindText = euiPaletteColorBlindBehindText();

  useEffect(() => {
    getNodeIPs().then((nodeIps) => { 
      setNodeIPs(nodeIps)
      const master = nodeIps.filter((nodeIp) => nodeIp.nodeType === 'master')
      setSelectedNodeIPs(master || [])
    });
  }, []);

  const handleOnChange = (e) => {
    setSelectedNodeIPs(e);
    onChange(parseNodeIPs(e));
  };

  const isValidIP = (value): boolean => {
    return value >= 0 && value <= 255
  }

  const handleRenderOption = (option, searchValue, contentClassName) => {
    const { label, value, type } = option;
    const color =  type === 'master' ? visColorsBehindText[3] : type === 'worker' ? visColorsBehindText[4] : visColorsBehindText[1];
    const dotColor = visColors[visColorsBehindText.indexOf(color)];
    return (
      <EuiHealth color={dotColor}>
        <span className={contentClassName}>
          <EuiHighlight search={searchValue}>{`${label}:${value}`}</EuiHighlight>
        </span>
      </EuiHealth>
    );
  };


  const handleOnCreateOption = (searchValue, flattenedOptions: any[] = []) => {
    if (!searchValue) {
      return;
    }
    const normalizedSearchValue = searchValue.trim().toLowerCase();

    if (!normalizedSearchValue) {
      return;
    }

    const newOption = {
      value: searchValue,
      label: searchValue,
      type: 'custom',
    };

    // Create the option if it doesn't exist.
    if (
      flattenedOptions.findIndex(
        (option) => option.label.trim().toLowerCase() === normalizedSearchValue
      ) === -1
    ) {
      setNodeIPs([...nodeIPs, newOption]);
    }

    // Select the option.
    setSelectedNodeIPs((prevSelected) => [...prevSelected, newOption]);
  };

  return (
    <EuiText>
      <p>
        This is the address the agent uses to communicate with the Wazuh server. It can be a list or an IP
        address or a fully qualified domain name (FQDN).
      </p>
      <EuiComboBox
        placeholder="Server Address"
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
