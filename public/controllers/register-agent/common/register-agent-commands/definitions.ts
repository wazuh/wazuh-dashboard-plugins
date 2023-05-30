import { OSDefinition } from './types';

const linuxDefinitionIOSDefinition = {
  name: 'linux',
  options: [
    {
      extension: 'rpm',
      architecture: 'amd64',
      packageManager: 'yum',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/yum/wazuh-agent-${props.version}-1.x86_64.${props.extension}`,
      installCommand: props =>
        `sudo ${props.packageManager} install -y ${props.urlPackage}`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
    {
      extension: 'deb',
      architecture: 'amd64',
      packageManager: 'curl',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/ wazuh-agent_${props.version}-1_${props.architecture}.${props.extension}`,
      installCommand: props =>
        `${props.packageManager} -so wazuh-agent.deb ${props.urlPackage} && sudo dpkg -i ./wazuh-agent.deb`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
    {
      extension: 'rpm',
      architecture: 'aarch64',
      packageManager: 'yum',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/yum/wazuh-agent-${props.version}-1.x86_64.${props.extension}`,
      installCommand: props =>
        `sudo ${props.packageManager} install -y ${props.urlPackage}`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
    {
      extension: 'deb',
      architecture: 'aarch64',
      packageManager: 'curl',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${props.version}-1_amd64.${props.extension}`,
      installCommand: props =>
        `${props.packageManager} -so wazuh-agent.deb ${props.urlPackage} && sudo dpkg -i ./wazuh-agent.deb`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
  ],
};

const windowsDefinitionIOSDefinition = {
  name: 'windows',
  options: [
    {
      extension: 'msi',
      architecture: '32/64',
      packageManager: 'win',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/windows/wazuh-agent-${props.version}-1.${props.extension}`,
      installCommand: props =>
        `Invoke-WebRequest -Uri ${props.urlPackage} -OutFile \${env.tmp}\\wazuh-agent.${props.extension}; msiexec.exe /i \${env.tmp}\\wazuh-agent.${props.extension} /q WAZUH_REGISTRATION_SERVER=''`,
      startCommand: props => `Start-Service -Name wazuh-agent`,
    },
  ],
};

const macDefinitionIOSDefinition = {
  name: 'mac',
  options: [
    {
      extension: 'pkg',
      architecture: '32/64',
      packageManager: 'mac',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/macos/wazuh-agent-${props.version}-1.${props.extension}`,
      installCommand: props =>
        `${props.packageManager} -so wazuh-agent.pkg ${props.urlPackage} && sudo launchctl setenv && sudo installer -pkg ./wazuh-agent.pkg -target /`,
      startCommand: props => `sudo /Library/Ossec/bin/wazuh-control start`,
    },
  ],
};

export const defaultPackageDefinitions = [
  linuxDefinition,
  windowsDefinition,
  macDefinition,
];
