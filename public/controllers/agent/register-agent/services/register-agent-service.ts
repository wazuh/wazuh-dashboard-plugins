import { WzRequest } from '../../../../react-services/wz-request';
import { OSArchitecture, OSVersion, RegisterAgentState } from '../types';
import { optionalPackages } from '../services';

/**
 * Get groups list from API and return with combobox format
 */
export async function getGroups(): Promise<any[]> {
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
export async function getAuthInfo(): Promise<any | { error: boolean }> {
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
  const password = match && match[1];
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
export function systemSelector(selectedVersion: OSVersion | '') {
  if (
    selectedVersion === 'redhat7' ||
    selectedVersion === 'amazonlinux2022' ||
    selectedVersion === 'centos7' ||
    selectedVersion === 'suse11' ||
    selectedVersion === 'suse12' ||
    selectedVersion === 'oraclelinux5' ||
    selectedVersion === '22' ||
    selectedVersion === 'amazonlinux2' ||
    selectedVersion === 'debian8' ||
    selectedVersion === 'debian9' ||
    selectedVersion === 'debian10' ||
    selectedVersion === 'busterorgreater' ||
    selectedVersion === 'ubuntu15' ||
    selectedVersion === 'ubuntu16' ||
    selectedVersion === 'leap15'
  ) {
    return 'sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent';
  } else if (
    selectedVersion === 'redhat5' ||
    selectedVersion === 'redhat6' ||
    selectedVersion === 'centos5' ||
    selectedVersion === 'centos6' ||
    selectedVersion === 'oraclelinux6' ||
    selectedVersion === 'amazonlinux1' ||
    selectedVersion === 'debian7' ||
    selectedVersion === 'ubuntu14'
  ) {
    return 'service wazuh-agent start';
  }
  return '';
}

// move to service
export const systemSelectorNet = (selectedVersion: OSVersion | '') => {
  if (selectedVersion === 'windowsxp' || selectedVersion === 'windows8') {
    return 'update-rc.d wazuh-agent defaults && service wazuh-agent start';
  }
  return '';
};

export const systemSelectorWazuhControlMacos = (
  selectedVersion: OSVersion | '',
) => {
  if (
    selectedVersion == 'sierra' ||
    selectedVersion == 'highSierra' ||
    selectedVersion == 'mojave' ||
    selectedVersion == 'catalina' ||
    selectedVersion == 'bigSur' ||
    selectedVersion == 'monterrey'
  ) {
    return '/Library/Ossec/bin/wazuh-control start';
  }
  return '';
};

export const systemSelectorWazuhControl = (selectedVersion: OSVersion | '') => {
  if (
    selectedVersion === 'solaris10' ||
    selectedVersion === 'solaris11' ||
    selectedVersion === '6.1 TL9' ||
    selectedVersion === '11.31'
  ) {
    return '/var/ossec/bin/wazuh-control start';
  }
  return '';
};

export const agentNameVariable = (
  agentName: string,
  selectedArchitecture: OSArchitecture,
) => {
  let parsedAgentName = `WAZUH_AGENT_NAME='${agentName}' `;
  return selectedArchitecture && agentName !== '' ? parsedAgentName : '';
};

/**
 * Get what is the SO incomplete in the deploy agent screen. Using the SO, Version and Architecture
 * @param selectedOS
 * @param selectedVersion
 * @param selectedArchitecture
 */
export function checkMissingOSSelection(
  selectedOS: string,
  selectedVersion: OSVersion,
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
    case 'cent':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
    case 'deb':
      return [...(!selectedArchitecture ? ['OS architecture'] : [])];
    case 'ubu':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
    case 'win':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
    case 'macos':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
    case 'open':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
    case 'sol':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
    case 'aix':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
    case 'hp':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
    case 'amazonlinux':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
    case 'fedora':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
    case 'oraclelinux':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
    case 'suse':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
    case 'raspbian':
      return [
        ...(!selectedVersion ? ['OS version'] : []),
        ...(selectedVersion && !selectedArchitecture
          ? ['OS architecture']
          : []),
      ];
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
    agentName,
  } = props;

  switch (selectedOS) {
    case 'rpm':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}yum install -y ${optionalPackages(
        selectedOS,
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      )}`;
    case 'cent':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}yum install -y ${optionalPackages(
        selectedOS,
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      )}`;
    case 'deb':
      return `curl -so wazuh-agent-${wazuhVersion}.deb ${optionalPackages(
        selectedOS,
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      )} && sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}dpkg -i ./wazuh-agent-${wazuhVersion}.deb`;
    case 'ubu':
      return `curl -so wazuh-agent-${wazuhVersion}.deb ${optionalPackages(
        selectedOS,
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      )} && sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}dpkg -i ./wazuh-agent-${wazuhVersion}.deb`;
    case 'macos':
      return `curl -so wazuh-agent-${wazuhVersion}.pkg https://packages.wazuh.com/4.x/macos/wazuh-agent-${wazuhVersion}-1.pkg && sudo launchctl setenv ${optionalDeploymentVariables(
        { ...props },
      )}${agentName}&& sudo installer -pkg ./wazuh-agent-${wazuhVersion}.pkg -target /`;
    case 'win':
      return `Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-${wazuhVersion}-1.msi -OutFile \${env:tmp}\\wazuh-agent-${wazuhVersion}.msi; msiexec.exe /i \${env:tmp}\\wazuh-agent-${wazuhVersion}.msi /q ${optionalDeploymentVariables(
        { ...props },
      )}${agentName}`;
    case 'wopen':
      return `sudo rpm --import https://packages.wazuh.com/key/GPG-KEY-WAZUH && sudo ${optionalDeploymentVariables(
        { ...props },
      )}${agentName} zypper install -y ${optionalPackages(
        selectedOS,
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      )}`;
    case 'sol':
      return `sudo curl -so ${optionalPackages(
        selectedOS,
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      )} && sudo ${agentName}&& ${
        selectedVersion == 'solaris11'
          ? 'pkg install -g wazuh-agent.p5p wazuh-agent'
          : 'pkgadd -d wazuh-agent.pkg'
      }`;
    case 'aix':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}rpm -ivh ${optionalPackages(
        selectedOS,
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      )}`;
    case 'hp':
      return `cd / && sudo curl -so ${optionalPackages(
        selectedOS,
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      )} && sudo ${agentName}groupadd wazuh && sudo useradd -G wazuh wazuh && sudo tar -xvf wazuh-agent.tar`;
    case 'amazonlinux':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}yum install -y ${optionalPackages(
        selectedOS,
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      )}`;
    case 'fedora':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}yum install -y ${optionalPackages(
        selectedOS,
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      )}`;
    case 'oraclelinux':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}yum install -y ${optionalPackages(
        selectedOS,
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      )}`;
    case 'suse':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}yum install -y ${optionalPackages(
        selectedOS,
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      )}`;
    case 'raspbian':
      return `curl -so wazuh-agent-${wazuhVersion}.deb ${optionalPackages(
        selectedOS,
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      )} && sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}dpkg -i ./wazuh-agent-${wazuhVersion}.deb`;
  }
}

export async function getWazuhVersion() {
  const data = await WzRequest.apiReq('GET', '/', {});
  const result = ((data || {}).data || {}).data || {};
  return result.api_version;
}
