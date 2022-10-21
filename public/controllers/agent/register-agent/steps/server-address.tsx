import { EuiComboBox, EuiComboBoxOptionOption, EuiText } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { WzRequest } from '../../../../react-services';

type Props = {
  onChangeValue: (value: any) => void;
}

export default function ServerAddress(props: Props) {
  const { onChangeValue } = props;
  const [serverAddress, setServerAddress] = useState('');
  const [nodeIPs, setNodeIPs] = useState<EuiComboBoxOptionOption[]>([]);
  const [selectedNodeIPs, setSelectedNodeIPs] = useState<EuiComboBoxOptionOption[]>([]);

  useEffect(()=> {
    getNodeIPs();
  },[])

  const getNodeIPs = async () => {
    try {
      const result = await WzRequest.apiReq('GET', '/cluster/nodes', {});
      const ipLists = result.data.data.affected_items.map((item) => ({ label: item.name, value: item.ip }));
      setNodeIPs(ipLists);
    } catch (error) {
      // 3013 - Cluster is not running
      //throw new Error(error);
    }
  };

  const handleOnChange = (e) => {
    setSelectedNodeIPs(e);
    onChangeValue(e);
  }

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
