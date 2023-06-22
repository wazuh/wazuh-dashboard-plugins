import { IOSDefinition, tOptionalParams } from '../core/register-commands/types';

// Defined OS combinations
export interface ILinuxOSTypes {
  name: 'linux';
  architecture: 'amd64' | 'aarch64';
  extension: 'rpm' | 'deb';
}
export interface IWindowsOSTypes {
  name: 'windows';
  architecture: '32/64';
  extension: 'msi';
}

export interface IMacOSTypes {
  name: 'mac';
  architecture: 'intel' | 'apple-silicon';
}

export type tOperatingSystem = ILinuxOSTypes | IMacOSTypes | IWindowsOSTypes;


export type tOptionalParameters = 'serverAddress' | 'agentName' | 'agentGroups' | 'wazuhPassword';

///////////////////////////////////////////////////////////////////
/// Operating system commands definitions
///////////////////////////////////////////////////////////////////

const linuxDefinition: IOSDefinition<ILinuxOSTypes, tOptionalParameters> = {
  name: 'linux',
  options: [
    {
      extension: 'deb',
      architecture: 'amd64',
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
        `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/ wazuh-agent_${props.wazuhVersion}-1_${props.architecture}.${props.extension}`,
      installCommand: props =>
        `curl -so wazuh-agent.deb ${props.urlPackage} && sudo dpkg -i ./wazuh-agent.deb`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
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
      extension: 'rpm',
      architecture: 'aarch64',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${props.wazuhVersion}-1_amd64.${props.extension}`,
      installCommand: props =>
        `curl -so wazuh-agent.deb ${props.urlPackage} && sudo dpkg -i ./wazuh-agent.deb`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
  ],
};

const windowsDefinition: IOSDefinition<IWindowsOSTypes, tOptionalParameters> = {
  name: 'windows',
  options: [
    {
      extension: 'msi',
      architecture: '32/64',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/windows/wazuh-agent-${props.wazuhVersion}-1.${props.extension}`,
      installCommand: props =>
        `Invoke-WebRequest -Uri ${props.urlPackage} -OutFile \${env.tmp}\\wazuh-agent.${props.extension}; msiexec.exe /i \${env.tmp}\\wazuh-agent.${props.extension} /q`,
      startCommand: props => `Start-Service -Name wazuh-agent`,
    },
  ],
};

const macDefinition: IOSDefinition<IMacOSTypes, tOptionalParameters> = {
  name: 'mac',
  options: [
    {
      architecture: 'intel',
      extension: 'pkg',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/macos/wazuh-agent-${props.wazuhVersion}-1.${props.extension}`,
      installCommand: props =>
        `mac -so wazuh-agent.pkg ${props.urlPackage} && sudo launchctl setenv && sudo installer -pkg ./wazuh-agent.pkg -target /`,
      startCommand: props => `sudo /Library/Ossec/bin/wazuh-control start`,
    },
    {
      architecture: 'apple-silicon',
      extension: 'pkg',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/macos/wazuh-agent-${props.wazuhVersion}-1.${props.extension}`,
      installCommand: props =>
        `mac -so wazuh-agent.pkg ${props.urlPackage} && sudo launchctl setenv && sudo installer -pkg ./wazuh-agent.pkg -target /`,
      startCommand: props => `sudo /Library/Ossec/bin/wazuh-control start`,
    }
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

export const optionalParamsDefinitions: tOptionalParams<tOptionalParameters> = {
  serverAddress: {
      property: 'WAZUH_MANAGER',
      getParamCommand:  props => {
        const { property, value } = props;
        return `${property}=${value}`;
    }
  },
  agentName: {
      property: 'WAZUH_AGENT_NAME',
      getParamCommand: props => {
          const { property, value } = props;
          return `${property}=${value}`;
      }
  },
  agentGroups: {
      property: 'WAZUH_AGENT_GROUP',
      getParamCommand:  props => {
        const { property, value } = props;
        return `${property}=${value}`;
    }
  },
  wazuhPassword: {
      property: 'WAZUH_PASSWORD',
      getParamCommand:  props => {
        const { property, value } = props;
        return `${property}=${value}`;
    }
  }
}
