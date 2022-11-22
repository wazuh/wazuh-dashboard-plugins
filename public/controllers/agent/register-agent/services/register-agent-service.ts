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
  os,
  udpProtocol,
  agentGroup,
  needsPassword,
  wazuhPassword,
}: RegisterAgentState) {

  let deployment = '';
  
  if(serverAddress){
    deployment = `WAZUH_MANAGER='${serverAddress}' `;
  }

  if (os == 'win') {
    deployment += `WAZUH_REGISTRATION_SERVER='${serverAddress}' `;
  }

  if (needsPassword) {
    deployment += `WAZUH_REGISTRATION_PASSWORD='${wazuhPassword}' `;
  }

  if (udpProtocol) {
    deployment += `WAZUH_PROTOCOL='UDP' `;
  }

  if (agentGroup.length) {
    deployment += `WAZUH_AGENT_GROUP='${agentGroup
      .map((item: { label: string, id:string }) => item.label)
      .join(',')}' `;
  }

  // macos doesnt need = param
  if (os === 'macos') {
    return deployment.replace(/=/g, ' ');
  }

  return deployment;
}

/**
 * Returns the command to start an agent depending on the OS and the SYS
 * @param os
 * @param selectedSYS
 */
export function systemSelector(version: OSVersion | '') {
  if (
    version === 'redhat7' ||
    version === 'amazonlinux2022' ||
    version === 'centos7' ||
    version === 'suse11' ||
    version === 'suse12' ||
    version === 'oraclelinux5' ||
    version === '22' ||
    version === 'amazonlinux2' ||
    version === 'debian8' ||
    version === 'debian9' ||
    version === 'debian10' ||
    version === 'busterorgreater' ||
    version === 'ubuntu15' ||
    version === 'ubuntu16' ||
    version === 'leap15'
  ) {
    return 'sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent';
  } else if (
    version === 'redhat5' ||
    version === 'redhat6' ||
    version === 'centos5' ||
    version === 'centos6' ||
    version === 'oraclelinux6' ||
    version === 'amazonlinux1' ||
    version === 'debian7' ||
    version === 'ubuntu14'
  ) {
    return 'service wazuh-agent start';
  }
  return '';
}

export const systemSelectorNet = (version: OSVersion | '') => {
  if (version === 'windowsxp' || version === 'windows8') {
    return 'update-rc.d wazuh-agent defaults && service wazuh-agent start';
  }
  return '';
};

export const systemSelectorWazuhControlMacos = (
  version: OSVersion | '',
) => {
  if (
    version == 'sierra' ||
    version == 'highSierra' ||
    version == 'mojave' ||
    version == 'catalina' ||
    version == 'bigSur' ||
    version == 'monterrey'
  ) {
    return '/Library/Ossec/bin/wazuh-control start';
  }
  return '';
};

export const systemSelectorWazuhControl = (version: OSVersion | '') => {
  if (
    version === 'solaris10' ||
    version === 'solaris11' ||
    version === '6.1 TL9' ||
    version === '11.31'
  ) {
    return '/var/ossec/bin/wazuh-control start';
  }
  return '';
};

export const agentNameVariable = (
  agentName: string,
  architecture: OSArchitecture,
) => {
  let parsedAgentName = `WAZUH_AGENT_NAME='${agentName}' `;
  return architecture && agentName !== '' ? parsedAgentName : '';
};

/**
 * Get what is the SO incomplete in the deploy agent screen. Using the SO, Version and Architecture
 * @param os
 * @param version
 * @param architecture
 */
export function checkMissingOSSelection(
  os: string,
  version: OSVersion,
  architecture: string,
) {
  if (!os) {
    return ['Operating system'];
  }
  switch (os) {
    case 'rpm':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
          ? ['OS architecture']
          : []),
      ];
    case 'cent':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
          ? ['OS architecture']
          : []),
      ];
    case 'deb':
      return [...(!architecture ? ['OS architecture'] : [])];
    case 'ubu':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
          ? ['OS architecture']
          : []),
      ];
    case 'win':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
          ? ['OS architecture']
          : []),
      ];
    case 'macos':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
          ? ['OS architecture']
          : []),
      ];
    case 'open':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
          ? ['OS architecture']
          : []),
      ];
    case 'sol':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
          ? ['OS architecture']
          : []),
      ];
    case 'aix':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
          ? ['OS architecture']
          : []),
      ];
    case 'hp':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
          ? ['OS architecture']
          : []),
      ];
    case 'amazonlinux':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
          ? ['OS architecture']
          : []),
      ];
    case 'fedora':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
          ? ['OS architecture']
          : []),
      ];
    case 'oraclelinux':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
          ? ['OS architecture']
          : []),
      ];
    case 'suse':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
          ? ['OS architecture']
          : []),
      ];
    case 'raspbian':
      return [
        ...(!version ? ['OS version'] : []),
        ...(version && !architecture
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
    os,
    version,
    architecture,
    wazuhVersion,
    agentName,
  } = props;

  switch (os) {
    case 'rpm':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}yum install -y ${optionalPackages(
        os,
        version,
        architecture,
        wazuhVersion,
      )}`;
    case 'cent':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}yum install -y ${optionalPackages(
        os,
        version,
        architecture,
        wazuhVersion,
      )}`;
    case 'deb':
      return `curl -so wazuh-agent-${wazuhVersion}.deb ${optionalPackages(
        os,
        version,
        architecture,
        wazuhVersion,
      )} && sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}dpkg -i ./wazuh-agent-${wazuhVersion}.deb`;
    case 'ubu':
      return `curl -so wazuh-agent-${wazuhVersion}.deb ${optionalPackages(
        os,
        version,
        architecture,
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
        os,
        version,
        architecture,
        wazuhVersion,
      )}`;
    case 'sol':
      return `sudo curl -so ${optionalPackages(
        os,
        version,
        architecture,
        wazuhVersion,
      )} && sudo ${agentName}&& ${
        version == 'solaris11'
          ? 'pkg install -g wazuh-agent.p5p wazuh-agent'
          : 'pkgadd -d wazuh-agent.pkg'
      }`;
    case 'aix':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}rpm -ivh ${optionalPackages(
        os,
        version,
        architecture,
        wazuhVersion,
      )}`;
    case 'hp':
      return `cd / && sudo curl -so ${optionalPackages(
        os,
        version,
        architecture,
        wazuhVersion,
      )} && sudo ${agentName}groupadd wazuh && sudo useradd -G wazuh wazuh && sudo tar -xvf wazuh-agent.tar`;
    case 'amazonlinux':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}yum install -y ${optionalPackages(
        os,
        version,
        architecture,
        wazuhVersion,
      )}`;
    case 'fedora':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}yum install -y ${optionalPackages(
        os,
        version,
        architecture,
        wazuhVersion,
      )}`;
    case 'oraclelinux':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}yum install -y ${optionalPackages(
        os,
        version,
        architecture,
        wazuhVersion,
      )}`;
    case 'suse':
      return `sudo ${optionalDeploymentVariables({
        ...props,
      })}${agentName}yum install -y ${optionalPackages(
        os,
        version,
        architecture,
        wazuhVersion,
      )}`;
    case 'raspbian':
      return `curl -so wazuh-agent-${wazuhVersion}.deb ${optionalPackages(
        os,
        version,
        architecture,
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
