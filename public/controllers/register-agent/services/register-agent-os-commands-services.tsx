import { tOptionalParameters } from '../core/config/os-commands-definitions';
import {
  IOptionalParameters,
  tOSEntryInstallCommand,
  tOSEntryProps,
} from '../core/register-commands/types';
import { tOperatingSystem } from '../hooks/use-register-agent-commands.test';

const getAllOptionals = (
  optionals: IOptionalParameters<tOptionalParameters>,
  osName?: tOperatingSystem['name'],
) => {
  // create paramNameOrderList, which is an array of the keys of optionals add interface
  const paramNameOrderList: (keyof IOptionalParameters<tOptionalParameters>)[] =
    ['serverAddress', 'wazuhPassword', 'agentGroups', 'agentName', 'protocol'];

  if (!optionals) return '';
  let paramsText = Object.entries(paramNameOrderList).reduce(
    (acc, [key, value]) => {
      if (optionals[value]) {
        acc += `${optionals[value]} `;
      }
      return acc;
    },
    '',
  );

  if (osName && osName.toLowerCase() === 'windows' && optionals.serverAddress) {
    // when os is windows we must to add wazuh registration server with server address
    paramsText =
      paramsText + `WAZUH_REGISTRATION_SERVER=${optionals.serverAddress.replace('WAZUH_MANAGER=','')} `;
  }

  return paramsText;
};

const getAllOptionalsMacos = (
  optionals: IOptionalParameters<tOptionalParameters>
) => {
  // create paramNameOrderList, which is an array of the keys of optionals add interface
  const paramNameOrderList: (keyof IOptionalParameters<tOptionalParameters>)[] =
    ['serverAddress', 'wazuhPassword', 'agentGroups', 'agentName', 'protocol'];

  if (!optionals) return '';
  return Object.entries(paramNameOrderList).reduce(
    (acc, [key, value]) => {
      if (optionals[value]) {
        acc += `${optionals[value]}\\n`;
      }
      return acc;
    },
    '',
  );
};

/******* Linux *******/

// Install command
export const getLinuxRPMInstallCommand = (
  props: tOSEntryInstallCommand<tOptionalParameters>,
) => {
  const { optionals, urlPackage } = props;
  return `sudo ${
    optionals && getAllOptionals(optionals)
  }yum install -y ${urlPackage}`;
};

export const getLinuxDEBInstallCommand = (
  props: tOSEntryInstallCommand<tOptionalParameters>,
) => {
  const { optionals, urlPackage } = props;
  return `curl -so wazuh-agent.deb ${urlPackage} && ${
    optionals && getAllOptionals(optionals)
  }dpkg -i ./wazuh-agent.deb`;
};

// Start command
export const getLinuxStartCommand = (
  _props: tOSEntryProps<tOptionalParameters>,
) => {
  return `sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent`;
};

/******** Windows ********/

export const getWindowsInstallCommand = (
  props: tOSEntryInstallCommand<tOptionalParameters>,
) => {
  const { optionals, urlPackage, name } = props;
  return `Invoke-WebRequest -Uri ${urlPackage} -OutFile \${env.tmp}\\wazuh-agent; msiexec.exe /i \${env.tmp}\\wazuh-agent /q ${
    optionals && getAllOptionals(optionals, name)
  }`;
};

export const getWindowsStartCommand = (
  _props: tOSEntryProps<tOptionalParameters>,
) => {
  return `NET START WazuhSvc`;
};

/******** MacOS ********/

export const getMacOsInstallCommand = (
  props: tOSEntryInstallCommand<tOptionalParameters>,
) => {
  const { optionals, urlPackage } = props;
  // Set macOS installation script with environment variables
  const optionalsText = optionals && getAllOptionalsMacos(optionals);
  const macOSInstallationOptions = `${optionalsText}`
    .replace(/\' ([a-zA-Z])/g, "' && $1") // Separate environment variables with &&
    .replace(/\"/g, '\\"') // Escape double quotes
    .trim();

  // If no variables are set, the echo will be empty
  const macOSInstallationSetEnvVariablesScript = macOSInstallationOptions
    ? `sudo echo -e "${macOSInstallationOptions}" > /tmp/wazuh_envs && `
    : ``;

  // Merge environment variables with installation script
  const macOSInstallationScript = `curl -so wazuh-agent.pkg ${urlPackage} && ${macOSInstallationSetEnvVariablesScript}sudo installer -pkg ./wazuh-agent.pkg -target /`;
  return macOSInstallationScript;
};

export const getMacosStartCommand = (
  _props: tOSEntryProps<tOptionalParameters>,
) => {
  return `sudo /Library/Ossec/bin/wazuh-control start`;
};
