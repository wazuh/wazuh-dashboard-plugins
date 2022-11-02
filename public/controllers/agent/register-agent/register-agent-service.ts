import { WzRequest } from '../../../react-services/wz-request';
import { optionalPackages } from './services';

export async function getGroups() {
  try {
    const result = await WzRequest.apiReq('GET', '/groups', {});
    return result.data.data.affected_items.map(item => ({
      label: item.name,
      id: item.name,
    }));
  } catch (error) {
    throw new Error(error);
  }
}

export async function getAuthInfo() {
  try {
    const result = await WzRequest.apiReq(
      'GET',
      '/agents/000/config/auth/auth',
      {},
    );
    return (result.data || {}).data || {};
  } catch (error) {
    return {
      error: true,
    };
  }
}

export function getHighlightCodeLanguage(selectedSO: string) {
  if (selectedSO.toLowerCase() === 'win') {
    return 'powershell';
  } else {
    return 'bash';
  }
}

export function obfuscatePassword(text: string) {
  let obfuscate = '';
  const regex = /WAZUH_REGISTRATION_PASSWORD=?\040?\'(.*?)\'/gm;
  const match = regex.exec(text);
  const password = match[1];
  if (password) {
    [...password].forEach(() => (obfuscate += '*'));
    text = text.replace(password, obfuscate);
  }
  return text;
}

type deployAgentState = {
  serverAddress: string;
  selectedArchitecture: string;
  selectedOS: string;
  selectedGroup: { label: string; value: string }[];
  udpProtocol: string;
  needsPassword: string;
  wazuhPassword: string;
  wazuhVersion: string;
};

export function optionalDeploymentVariables({
  serverAddress,
  selectedOS,
  udpProtocol,
  selectedGroup,
  needsPassword,
  wazuhPassword,
}: deployAgentState) {
  let deployment = `WAZUH_MANAGER='${serverAddress}' `;

  if (selectedOS == 'win') {
    deployment += `WAZUH_REGISTRATION_SERVER='${serverAddress}' `;
  }

  if (needsPassword) {
    deployment += `WAZUH_REGISTRATION_PASSWORD='${wazuhPassword}' `;
  }

  if (udpProtocol) {
    deployment += `WAZUH_PROTOCOL='UDP' `;
  }

  if (selectedGroup.length) {
    deployment += `WAZUH_AGENT_GROUP='${selectedGroup
      .map(item => item.label)
      .join(',')}' `;
  }

  // macos doesnt need = param
  if (selectedOS === 'macos') {
    return deployment.replace(/=/g, ' ');
  }

  return deployment;
}

export function systemSelector(selectedOS: string, selectedSYS: string) {
  if (selectedOS === 'rpm') {
    if (selectedSYS === 'systemd') {
      return 'sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent';
    } else
      return 'sudo chkconfig --add wazuh-agent\nsudo service wazuh-agent start';
  } else if (selectedOS === 'deb') {
    if (selectedSYS === 'systemd') {
      return 'sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent';
    } else
      return 'sudo update-rc.d wazuh-agent defaults 95 10\nsudo service wazuh-agent start';
  } else return '';
}

export function checkMissingOSSelection(
  selectedOS: string,
  selectedVersion: string,
  selectedArchitecture: string,
) {
  if (!selectedOS) {
    return ['Operating system'];
  }
  switch (selectedOS) {
    case 'rpm':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
    case 'deb':
      return [...(!selectedArchitecture ? ['OS architecture'] : [])];
    default:
      return [];
  }
}

export function getCommandText(props: deployAgentState) {
  const {
    selectedOS,
    selectedArchitecture,
    wazuhVersion,
  } = props;

  switch (selectedOS) {
    case 'rpm':
        return `sudo ${optionalDeploymentVariables({...props})}yum install ${optionalPackages(selectedOS,selectedArchitecture,wazuhVersion)}`;
    case 'deb':
        return `curl -so wazuh-agent-${wazuhVersion}.deb ${optionalPackages(selectedOS,selectedArchitecture,wazuhVersion)} && sudo ${optionalDeploymentVariables({...props})}dpkg -i ./wazuh-agent-${wazuhVersion}.deb`;
    case 'macos':
        return `curl -so wazuh-agent-${wazuhVersion}.pkg https://packages.wazuh.com/4.x/macos/wazuh-agent-${wazuhVersion}-1.pkg && sudo launchctl setenv ${optionalDeploymentVariables({...props})}&& sudo installer -pkg ./wazuh-agent-${wazuhVersion}.pkg -target /`;
    case 'win':
        return `Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-${wazuhVersion}-1.msi -OutFile \${env:tmp}\\wazuh-agent-${wazuhVersion}.msi; msiexec.exe /i \${env:tmp}\\wazuh-agent-${wazuhVersion}.msi /q ${optionalDeploymentVariables({...props})}`;
    }
}
