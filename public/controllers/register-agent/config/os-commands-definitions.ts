import { IOSDefinition, tOptionalParams } from '../core/register-commands/types';

///////////////////////////////////////////////////////////////////
/// Operating system commands definitions
///////////////////////////////////////////////////////////////////

const linuxDefinition: IOSDefinition = {
  name: 'linux',
  options: [
    {
      extension: 'rpm',
      architecture: 'amd64',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/yum/wazuh-agent-${props.wazuhVersion}-1.x86_64.${props.extension}`,
      installCommand: props =>
        `sudo yum install -y ${props.urlPackage}`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
    {
      extension: 'deb',
      architecture: 'amd64',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/ wazuh-agent_${props.wazuhVersion}-1_${props.architecture}.${props.extension}`,
      installCommand: props =>
        `curl -so wazuh-agent.deb ${props.urlPackage} && sudo dpkg -i ./wazuh-agent.deb`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
    {
      extension: 'rpm',
      architecture: 'aarch64',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/yum/wazuh-agent-${props.wazuhVersion}-1.x86_64.${props.extension}`,
      installCommand: props =>
        `sudo yum install -y ${props.urlPackage}`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
    {
      extension: 'deb',
      architecture: 'aarch64',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${props.wazuhVersion}-1_amd64.${props.extension}`,
      installCommand: props =>
        `curl -so wazuh-agent.deb ${props.urlPackage} && sudo dpkg -i ./wazuh-agent.deb`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
  ],
};

const windowsDefinition: IOSDefinition = {
  name: 'windows',
  options: [
    {
      extension: 'msi',
      architecture: 'x86',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/windows/wazuh-agent-${props.wazuhVersion}-1.${props.extension}`,
      installCommand: props =>
        `Invoke-WebRequest -Uri ${props.urlPackage} -OutFile \${env.tmp}\\wazuh-agent.${props.extension}; msiexec.exe /i \${env.tmp}\\wazuh-agent.${props.extension} /q`,
      startCommand: props => `Start-Service -Name wazuh-agent`,
    },
  ],
};

const macDefinition: IOSDefinition = {
  name: 'mac',
  options: [
    {
      extension: 'pkg',
      architecture: '32/64',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/macos/wazuh-agent-${props.wazuhVersion}-1.${props.extension}`,
      installCommand: props =>
        `mac -so wazuh-agent.pkg ${props.urlPackage} && sudo launchctl setenv && sudo installer -pkg ./wazuh-agent.pkg -target /`,
      startCommand: props => `sudo /Library/Ossec/bin/wazuh-control start`,
    },
  ],
};

export const osCommandsDefinitions = [
  linuxDefinition,
  windowsDefinition,
  macDefinition,
];

///////////////////////////////////////////////////////////////////
/// Optional parameters definitions
///////////////////////////////////////////////////////////////////

export const optionalParamsDefinitions: tOptionalParams = {
  server_address: {
      property: 'WAZUH_MANAGER',
      getParamCommand:  props => {
        const { property, value } = props;
        return `${property}=${value}`;
    }
  },
  agent_name: {
      property: 'WAZUH_AGENT_NAME',
      getParamCommand: props => {
          const { property, value } = props;
          return `${property}=${value}`;
      }
  },
  protocol: {
      property: 'WAZUH_MANAGER_PROTOCOL',
      getParamCommand: props => {
        const { property, value } = props;
        return `${property}=${value}`;
    }
  },
  agent_group: {
      property: 'WAZUH_AGENT_GROUP',
      getParamCommand:  props => {
        const { property, value } = props;
        return `${property}=${value}`;
    }
  },
  wazuh_password: {
      property: 'WAZUH_PASSWORD',
      getParamCommand:  props => {
        const { property, value } = props;
        return `${property}=${value}`;
    }
  }
}
