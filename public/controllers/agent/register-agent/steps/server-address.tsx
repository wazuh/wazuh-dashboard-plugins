import { EuiComboBox, EuiComboBoxOptionOption, EuiText } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { getNodeIPs, parseNodeIPs } from '../utils';

type Props = {
  onChange: (value: string) => void;
};

export default function ServerAddress(props: Props) {
  const { onChange } = props;
  const [nodeIPs, setNodeIPs] = useState<EuiComboBoxOptionOption[]>([]);
  const [selectedNodeIPs, setSelectedNodeIPs] = useState<EuiComboBoxOptionOption[]>([]);

  useEffect(() => {
    getNodeIPs().then((nodeIps) => setNodeIPs(nodeIps));
  }, []);

  const handleOnChange = (e) => {
    setSelectedNodeIPs(e);
    onChange(parseNodeIPs(e));
  };

  return (
    <EuiText>
      <p>
        This is the address the agent uses to communicate with the Wazuh server. It can be an IP
        address or a fully qualified domain name (FQDN).
      </p>
      <EuiComboBox
        placeholder="Server Address"
        selectedOptions={selectedNodeIPs}
        options={nodeIPs}
        onChange={handleOnChange}
        data-test-subj="demoComboBox"
      />
    </EuiText>
  );
}
