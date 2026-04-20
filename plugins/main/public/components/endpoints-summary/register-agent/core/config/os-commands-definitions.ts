import {
  getLinuxStartCommand,
  getMacOsInstallCommand,
  getMacosStartCommand,
  getWindowsInstallCommand,
  getWindowsStartCommand,
  getDEBAMD64InstallCommand,
  getRPMAMD64InstallCommand,
  getRPMARM64InstallCommand,
  getDEBARM64InstallCommand,
} from '../../services/register-agent-os-commands-services';
import {
  scapeSpecialCharsForLinux,
  scapeSpecialCharsForMacOS,
  scapeSpecialCharsForWindows,
} from '../../services/wazuh-password-service';
import { IOSDefinition, tOptionalParams } from '../register-commands/types';
import { PLUGIN_MAJOR_VERSION } from '../../../../../../common/constants';

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
  architecture: 'MSI 32/64 bits';
}

/** MacOS options **/
export interface IMacOSIntel {
  name: 'macOS';
  architecture: 'Intel';
}

export interface IMacOSApple {
  name: 'macOS';
  architecture: 'Apple silicon';
}

type IMacOSTypes = IMacOSApple | IMacOSIntel;

export type tOperatingSystem = ILinuxOSTypes | IMacOSTypes | IWindowsOSTypes;

export type tOptionalParameters =
  | 'serverAddress'
  | 'agentName'
  | 'agentGroups'
  | 'wazuhPassword'
  | 'protocol';

///////////////////////////////////////////////////////////////////
/// Operating system commands definitions
///////////////////////////////////////////////////////////////////

const linuxDefinition: IOSDefinition<ILinuxOSTypes, tOptionalParameters> = {
  name: 'LINUX',
  options: [
    {
      architecture: 'DEB amd64',
      packageName: props => `wazuh-agent_${props.wazuhVersion}-beta1_amd64.deb`,
      urlPackage: props =>
        `https://packages-staging.xdrsiem.wazuh.info/pre-release/${PLUGIN_MAJOR_VERSION}.x/apt/pool/main/w/wazuh-agent/${props.packageName}`,
      installCommand: props => getDEBAMD64InstallCommand(props),
      startCommand: props => getLinuxStartCommand(props),
    },
    {
      architecture: 'RPM amd64',
      packageName: props => `wazuh-agent-${props.wazuhVersion}-beta1.x86_64.rpm`,
      urlPackage: props =>
        `https://packages-staging.xdrsiem.wazuh.info/pre-release/${PLUGIN_MAJOR_VERSION}.x/yum/${props.packageName}`,
      installCommand: props => getRPMAMD64InstallCommand(props),
      startCommand: props => getLinuxStartCommand(props),
    },
    {
      architecture: 'DEB aarch64',
      packageName: props => `wazuh-agent_${props.wazuhVersion}-beta1_arm64.deb`,
      urlPackage: props =>
        `https://packages-staging.xdrsiem.wazuh.info/pre-release/${PLUGIN_MAJOR_VERSION}.x/apt/pool/main/w/wazuh-agent/${props.packageName}`,
      installCommand: props => getDEBARM64InstallCommand(props),
      startCommand: props => getLinuxStartCommand(props),
    },
    {
      architecture: 'RPM aarch64',
      packageName: props => `wazuh-agent-${props.wazuhVersion}-beta1.aarch64.rpm`,
      urlPackage: props =>
        `https://packages-staging.xdrsiem.wazuh.info/pre-release/${PLUGIN_MAJOR_VERSION}.x/yum/${props.packageName}`,
      installCommand: props => getRPMARM64InstallCommand(props),
      startCommand: props => getLinuxStartCommand(props),
    },
  ],
};

const windowsDefinition: IOSDefinition<IWindowsOSTypes, tOptionalParameters> = {
  name: 'WINDOWS',
  options: [
    {
      architecture: 'MSI 32/64 bits',
      packageName: props => `wazuh-agent-${props.wazuhVersion}-beta1.msi`,
      urlPackage: props =>
        `https://packages-staging.xdrsiem.wazuh.info/pre-release/${PLUGIN_MAJOR_VERSION}.x/windows/${props.packageName}`,
      installCommand: props => getWindowsInstallCommand(props),
      startCommand: props => getWindowsStartCommand(props),
    },
  ],
};

const macDefinition: IOSDefinition<IMacOSTypes, tOptionalParameters> = {
  name: 'macOS',
  options: [
    {
      architecture: 'Intel',
      packageName: props => `wazuh-agent-${props.wazuhVersion}-beta1.intel64.pkg`,
      urlPackage: props =>
        `https://packages-staging.xdrsiem.wazuh.info/pre-release/${PLUGIN_MAJOR_VERSION}.x/macos/${props.packageName}`,
      installCommand: props => getMacOsInstallCommand(props),
      startCommand: props => getMacosStartCommand(props),
    },
    {
      architecture: 'Apple silicon',
      packageName: props => `wazuh-agent-${props.wazuhVersion}-beta1.arm64.pkg`,
      urlPackage: props =>
        `https://packages-staging.xdrsiem.wazuh.info/pre-release/${PLUGIN_MAJOR_VERSION}.x/macos/${props.packageName}`,
      installCommand: props => getMacOsInstallCommand(props),
      startCommand: props => getMacosStartCommand(props),
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
    getParamCommand: (props, selectedOS) => {
      const { property, value } = props;
      return value !== '' ? `${property}='${value}'` : '';
    },
  },
  agentName: {
    property: 'WAZUH_AGENT_NAME',
    getParamCommand: (props, selectedOS) => {
      const { property, value } = props;
      return value !== '' ? `${property}='${value}'` : '';
    },
  },
  agentGroups: {
    property: 'WAZUH_AGENT_GROUP',
    getParamCommand: (props, selectedOS) => {
      const { property, value } = props;
      let parsedValue = value;
      if (Array.isArray(value)) {
        parsedValue = value.length > 0 ? value.join(',') : '';
      }
      return parsedValue ? `${property}='${parsedValue}'` : '';
    },
  },
  protocol: {
    property: 'WAZUH_PROTOCOL',
    getParamCommand: (props, selectedOS) => {
      const { property, value } = props;
      return value !== '' ? `${property}='${value}'` : '';
    },
  },
  wazuhPassword: {
    property: 'WAZUH_REGISTRATION_PASSWORD',
    getParamCommand: (props, selectedOS) => {
      const { property, value } = props;
      if (!value) {
        return '';
      }
      if (selectedOS) {
        let osName = selectedOS.name.toLocaleLowerCase();
        switch (osName) {
          case 'linux':
            return `${property}=$'${scapeSpecialCharsForLinux(value)}'`;
          case 'macos':
            return `${property}='${scapeSpecialCharsForMacOS(value)}'`;
          case 'windows':
            return `${property}='${scapeSpecialCharsForWindows(value)}'`;
          default:
            return `${property}=$'${value}'`;
        }
      }

      return value !== '' ? `${property}=$'${value}'` : '';
    },
  },
};
