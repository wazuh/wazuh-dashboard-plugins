import {
  IOSDefinition,
  tOptionalParams,
} from '../register-commands/types';

// Defined OS combinations

/** Linux options **/
export interface ILinuxAMDRPM {
  name: 'LINUX';
  architecture: 'RPM amd64';
}

export interface ILinuxAARCHRPM {
  name: 'LINUX';
  architecture: 'RPM aarch64';
}

export interface ILinuxAMDDEB {
  name: 'LINUX';
  architecture: 'DEB amd64';
}

export interface ILinuxAARCHDEB {
  name: 'LINUX';
  architecture: 'DEB aarch64';
}

type ILinuxOSTypes =
  | ILinuxAMDRPM
  | ILinuxAARCHRPM
  | ILinuxAMDDEB
  | ILinuxAARCHDEB;

/** Windows options **/
export interface IWindowsOSTypes {
  name: 'WINDOWS';
  architecture: 'MSI 32/64';
}

/** MacOS options **/
export interface IMacOSIntel {
  name: 'macOS';
  architecture: 'Intel';
}

export interface IMacOSApple {
  name: 'macOS';
  architecture: 'Apple Silicon';
}

type IMacOSTypes = IMacOSApple | IMacOSIntel;

export type tOperatingSystem = ILinuxOSTypes | IMacOSTypes | IWindowsOSTypes;

export type tOptionalParameters =
  | 'serverAddress'
  | 'agentName'
  | 'agentGroups'
  | 'wazuhPassword';

///////////////////////////////////////////////////////////////////
/// Operating system commands definitions
///////////////////////////////////////////////////////////////////

const linuxDefinition: IOSDefinition<ILinuxOSTypes, tOptionalParameters> = {
  name: 'LINUX',
  options: [
    {
      architecture: 'DEB amd64',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/yum/wazuh-agent-${props.wazuhVersion}-1.x86_64`,
      installCommand: props =>
        `sudo yum install -y ${props.urlPackage} 
        ${props.optionals?.serverAddress || ''} 
        ${props.optionals?.agentName || ''} 
        ${props.optionals?.agentGroups || ''} 
        ${props.optionals?.wazuhPassword || ''}`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
    {
      architecture: 'DEB aarch64',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/ wazuh-agent_${props.wazuhVersion}-1_${props.architecture}`,
      installCommand: props =>
        `curl -so wazuh-agent.deb ${props.urlPackage} && sudo dpkg -i ./wazuh-agent.deb 
        ${props.optionals?.serverAddress || ''} 
        ${props.optionals?.agentName || ''} 
        ${props.optionals?.agentGroups || ''} 
        ${props.optionals?.wazuhPassword || ''}`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
    {
      architecture: 'RPM amd64',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/yum/wazuh-agent-${props.wazuhVersion}-1.x86_64`,
      installCommand: props =>
        `sudo yum install -y ${props.urlPackage} 
        ${props.optionals?.serverAddress || ''} 
        ${props.optionals?.agentName || ''} 
        ${props.optionals?.agentGroups || ''} 
        ${props.optionals?.wazuhPassword || ''}`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
    {
      architecture: 'RPM aarch64',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${props.wazuhVersion}-1_amd64`,
      installCommand: props =>
        `curl -so wazuh-agent.deb ${
          props.urlPackage
        } && sudo dpkg -i ./wazuh-agent.deb 
        ${props.optionals?.serverAddress || ''} 
        ${props.optionals?.agentName || ''} 
        ${props.optionals?.agentGroups || ''} 
        ${props.optionals?.wazuhPassword || ''}`,
      startCommand: props => `sudo systemctl start wazuh-agent`,
    },
  ],
};

const windowsDefinition: IOSDefinition<IWindowsOSTypes, tOptionalParameters> = {
  name: 'WINDOWS',
  options: [
    {
      architecture: 'MSI 32/64',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/windows/wazuh-agent-${props.wazuhVersion}-1`,
      installCommand: props =>
        `Invoke-WebRequest -Uri ${props.urlPackage} -OutFile \${env.tmp}\\wazuh-agent; msiexec.exe /i \${env.tmp}\\wazuh-agent /q 
        ${props.optionals?.serverAddress || ''} 
        ${props.optionals?.agentName || ''} 
        ${props.optionals?.agentGroups || ''} 
        ${props.optionals?.wazuhPassword || ''}`,
      startCommand: props => `Start-Service -Name wazuh-agent`,
    },
  ],
};

const macDefinition: IOSDefinition<IMacOSTypes, tOptionalParameters> = {
  name: 'macOS',
  options: [
    {
      architecture: 'Intel',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/macos/wazuh-agent-${props.wazuhVersion}-1`,
      installCommand: props =>
        `mac -so wazuh-agent.pkg ${props.urlPackage} && sudo launchctl setenv && sudo installer -pkg ./wazuh-agent.pkg -target / 
        ${props.optionals?.serverAddress || ''} 
        ${props.optionals?.agentName || ''} 
        ${props.optionals?.agentGroups || ''} 
        ${props.optionals?.wazuhPassword || ''}`,
      startCommand: props => `sudo /Library/Ossec/bin/wazuh-control start`,
    },
    {
      architecture: 'Apple Silicon',
      urlPackage: props =>
        `https://packages.wazuh.com/4.x/macos/wazuh-agent-${props.wazuhVersion}-1`,
      installCommand: props =>
        `mac -so wazuh-agent.pkg ${props.urlPackage} && sudo launchctl setenv && sudo installer -pkg ./wazuh-agent.pkg -target 
        ${props.optionals?.serverAddress || ''} 
        ${props.optionals?.agentName || ''} 
        ${props.optionals?.agentGroups || ''} 
        ${props.optionals?.wazuhPassword || ''}`,
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

export const optionalParamsDefinitions: tOptionalParams<tOptionalParameters> = {
  serverAddress: {
    property: 'WAZUH_MANAGER',
    getParamCommand: props => {
      const { property, value } = props;
      return value !== '' ? `${property}='${value}'` : '';
    },
  },
  agentName: {
    property: 'WAZUH_AGENT_NAME',
    getParamCommand: props => {
      const { property, value } = props;
      return value !== '' ? `${property}='${value}'` : '';
    },
  },
  agentGroups: {
    property: 'WAZUH_AGENT_GROUP',
    getParamCommand: props => {
      const { property, value } = props;
      let parsedValue = value;
      if(Array.isArray(value)){
        parsedValue = value.length > 0 ? value.join(',') : '';
      }
      return parsedValue ? `${property}='${parsedValue}'` : '';
    },
  },
  wazuhPassword: {
    property: 'WAZUH_PASSWORD',
    getParamCommand: props => {
      const { property, value } = props;
      return value !== '' ? `${property}='${value}'` : '';
    },
  },
};
