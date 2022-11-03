import { EuiComboBoxOptionOption } from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { RegisterAgentState } from '../register-agent-main';
import { optionalPackages } from '../services';

/**
 * Get groups list from API and return with combobox format
 */
export async function getGroups(): Promise<EuiComboBoxOptionOption<any>[]> {
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

/**
 * Get the agents auth configuration
 */
export async function getAuthInfo(): Promise<object|{error:boolean}> {
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

/**
 * Return the cli command type by selected OS
 * @param selectedSO 
 */
export function getHighlightCodeLanguage(selectedSO: string) {
  if (selectedSO.toLowerCase() === 'win') {
    return 'powershell';
  } else {
    return 'bash';
  }
}

/**
 * Return the password obfuscated
 * @param text 
 */
export function obfuscatePassword(text: string) {
  let obfuscate = '';
  const regex = /WAZUH_REGISTRATION_PASSWORD=?\040?\'(.*?)\'/gm;
  const match = regex.exec(text);
  const password = match && match[1] ;
  if (password) {
    [...password].forEach(() => (obfuscate += '*'));
    text = text.replace(password, obfuscate);
  }
  return text;
}


/**
 * Add optionals parameters in the register agent command text 
 */
export function optionalDeploymentVariables({
  serverAddress,
  selectedOS,
  udpProtocol,
  selectedGroup,
  needsPassword,
  wazuhPassword,
}: RegisterAgentState) {
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

/**
 * Returns the command to start an agent depending on the OS and the SYS
 * @param selectedOS 
 * @param selectedSYS 
 */
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

/**
 * Get what is the SO incomplete in the deploy agent screen. Using the SO, Version and Architecture 
 * @param selectedOS 
 * @param selectedVersion 
 * @param selectedArchitecture 
 */
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

/**
 * Get the register agent command text depending on the selected Options
 * @param props 
 */
export function getCommandText(props: RegisterAgentState) {
  const {
    selectedOS,
    selectedVersion,
    selectedArchitecture,
    wazuhVersion,
  } = props;

  switch (selectedOS) {
    case 'rpm':
        return `sudo ${optionalDeploymentVariables({...props})}yum install ${optionalPackages(selectedOS,selectedVersion,selectedArchitecture,wazuhVersion)}`;
    case 'deb':
        return `curl -so wazuh-agent-${wazuhVersion}.deb ${optionalPackages(selectedOS,selectedVersion,selectedArchitecture,wazuhVersion)} && sudo ${optionalDeploymentVariables({...props})}dpkg -i ./wazuh-agent-${wazuhVersion}.deb`;
    case 'macos':
        return `curl -so wazuh-agent-${wazuhVersion}.pkg https://packages.wazuh.com/4.x/macos/wazuh-agent-${wazuhVersion}-1.pkg && sudo launchctl setenv ${optionalDeploymentVariables({...props})}&& sudo installer -pkg ./wazuh-agent-${wazuhVersion}.pkg -target /`;
    case 'win':
        return `Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-${wazuhVersion}-1.msi -OutFile \${env:tmp}\\wazuh-agent-${wazuhVersion}.msi; msiexec.exe /i \${env:tmp}\\wazuh-agent-${wazuhVersion}.msi /q ${optionalDeploymentVariables({...props})}`;
    }
}
