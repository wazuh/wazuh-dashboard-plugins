import { OSDefinition } from './types';

const linuxDefinition: OSDefinition = {
  name: 'linux',
  options: [
    // sudo yum install -y https://packages.wazuh.com/4.x/yum/wazuh-agent-4.4.1-1.x86_64.rpm
    {
      extension: 'rpm',
      architecture: 'amd64',
      packageManager: 'yum',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/yum/wazuh-agent-${props.version}-1.x86_64.${props.extension}`,
      installCommand: props =>
        `sudo ${props.packageManager} install -y ${props.urlPackage}`,
    },
    // curl -so wazuh-agent.deb https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.4.1-1_amd64.deb &&
    // sudo dpkg -i ./wazuh-agent.deb
    {
      extension: 'deb',
      architecture: 'amd64',
      packageManager: 'curl',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/ wazuh-agent_${props.version}-1_${props.architecture}.${props.extension}`,
      installCommand: props =>
        `${props.packageManager} -so wazuh-agent.deb ${props.urlPackage} && sudo dpkg -i ./wazuh-agent.deb`,
    },
    // sudo yum install -y https://packages.wazuh.com/4.x/yum/wazuh-agent-4.4.1-1.x86_64.rpm
    {
      extension: 'rpm',
      architecture: 'aarch64',
      packageManager: 'yum',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/yum/wazuh-agent-${props.version}-1.x86_64.${props.extension}`,
      installCommand: props =>
        `sudo ${props.packageManager} install -y ${props.urlPackage}`,
    },
    // curl -so wazuh-agent.deb https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_4.4.1-1_amd64.deb
    // && sudo dpkg -i ./wazuh-agent.deb
    {
      extension: 'deb',
      architecture: 'aarch64',
      packageManager: 'curl',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${props.version}-1_amd64.${props.extension}`,
      installCommand: props =>
        `${props.packageManager} -so wazuh-agent.deb ${props.urlPackage} && sudo dpkg -i ./wazuh-agent.deb`,
    },
  ],
};

const windowsDefinition: OSDefinition = {
  name: 'windows',
  options: [
    // Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-4.4.1-1.msi
    // -OutFile ${env:tmp}\wazuh-agent.msi; msiexec.exe /i ${env:tmp}\wazuh-agent.msi
    // /q WAZUH_REGISTRATION_SERVER=''
    {
      extension: 'msi',
      architecture: '32/64',
      packageManager: 'win',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/windows/wazuh-agent-${props.version}-1.${props.extension}`,
      installCommand: props =>
        `Invoke-WebRequest -Uri ${props.urlPackage} -OutFile \${env.tmp}\\wazuh-agent.${props.extension}; msiexec.exe /i \${env.tmp}\\wazuh-agent.${props.extension} /q WAZUH_REGISTRATION_SERVER=''`,
    },
  ],
};

const macDefinition: OSDefinition = {
  name: 'mac',
  options: [
    // curl -so wazuh-agent.pkg https://packages.wazuh.com/4.x/macos/wazuh-agent-4.4.1-1.pkg
    //&& sudo launchctl setenv && sudo installer -pkg ./wazuh-agent.pkg -target /
    {
      extension: 'pkg',
      architecture: '32/64',
      packageManager: 'mac',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/macos/wazuh-agent-${props.version}-1.${props.extension}`,
      installCommand: props =>
        `${props.packageManager} -so wazuh-agent.pkg ${props.urlPackage} && sudo launchctl setenv && sudo installer -pkg ./wazuh-agent.pkg -target /`,
    },
  ],
};

export const defaultPackageDefinitions = [
  linuxDefinition,
  windowsDefinition,
  macDefinition,
];
