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
      paramsText +
      `WAZUH_REGISTRATION_SERVER=${optionals.serverAddress.replace(
        'WAZUH_MANAGER=',
        '',
      )} `;
  }

  return paramsText;
};

const getAllOptionalsMacos = (
  optionals: IOptionalParameters<tOptionalParameters>,
) => {
  // create paramNameOrderList, which is an array of the keys of optionals add interface
  const paramNameOrderList: (keyof IOptionalParameters<tOptionalParameters>)[] =
    ['serverAddress', 'agentGroups', 'agentName', 'protocol'];

  if (!optionals) return '';

  const paramsValueList = [];

  paramNameOrderList.forEach(paramName => {
    if (optionals[paramName] && optionals[paramName] !== '') {
      paramsValueList.push(optionals[paramName]);
    }
  });

  if (paramsValueList.length) {
    return paramsValueList.join(' && ');
  }

  return '';
};

/******* DEB *******/

export const getDEBAMD64InstallCommand = (
  props: tOSEntryInstallCommand<tOptionalParameters>,
) => {
  const { optionals, urlPackage, wazuhVersion } = props;
  const packageName = `wazuh-agent_${wazuhVersion}-1_amd64.deb`;
  return `wget ${urlPackage} && sudo ${
    optionals && getAllOptionals(optionals)
  }dpkg -i ./${packageName}`;
};

export const getDEBARM64InstallCommand = (
  props: tOSEntryInstallCommand<tOptionalParameters>,
) => {
  const { optionals, urlPackage, wazuhVersion } = props;
  const packageName = `wazuh-agent_${wazuhVersion}-1_arm64.deb`;
  return `wget ${urlPackage} && sudo ${
    optionals && getAllOptionals(optionals)
  }dpkg -i ./${packageName}`;
};

/******* RPM *******/

export const getRPMAMD64InstallCommand = (
  props: tOSEntryInstallCommand<tOptionalParameters>,
) => {
  const { optionals, urlPackage, wazuhVersion, architecture } = props;
  const packageName = `wazuh-agent-${wazuhVersion}-1.x86_64.rpm`;
  return `curl -o ${packageName} ${urlPackage} && sudo ${
    optionals && getAllOptionals(optionals)
  }rpm -ihv ${packageName}`;
};

export const getRPMARM64InstallCommand = (
  props: tOSEntryInstallCommand<tOptionalParameters>,
) => {
  const { optionals, urlPackage, wazuhVersion, architecture } = props;
  const packageName = `wazuh-agent-${wazuhVersion}-1.aarch64.rpm`;
  return `curl -o ${packageName} ${urlPackage} && sudo ${
    optionals && getAllOptionals(optionals)
  }rpm -ihv ${packageName}`;
};

/******* Linux *******/

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

export const transformOptionalsParamatersMacOSCommand = (command: string) => {
  return command
    .replace(/\' ([a-zA-Z])/g, "' && $1") // Separate environment variables with &&
    .replace(/\"/g, '\\"') // Escape double quotes
    .trim();
};

export const getMacOsInstallCommand = (
  props: tOSEntryInstallCommand<tOptionalParameters>,
) => {
  const { optionals, urlPackage } = props;
  // Set macOS installation script with environment variables
  const optionalsText = optionals && getAllOptionalsMacos(optionals);
  const macOSInstallationOptions = transformOptionalsParamatersMacOSCommand(
    optionalsText || '',
  );
  let wazuhPasswordParamWithValue = '';
  if (optionals?.wazuhPassword) {
    /**
     * We use the JSON.stringify to prevent that the scaped specials characters will be removed
     * and maintain the format of the password
      The JSON.stringify maintain the password format but adds " to wrap the characters
    */
    const scapedPasswordLength = JSON.stringify(
      optionals?.wazuhPassword,
    ).length;
    // We need to remove the " added by JSON.stringify
    wazuhPasswordParamWithValue = `${JSON.stringify(
      optionals?.wazuhPassword,
    ).substring(1, scapedPasswordLength - 1)}\\n`;
  }
  // If no variables are set, the echo will be empty
  const macOSInstallationSetEnvVariablesScript = macOSInstallationOptions
    ? `echo "${macOSInstallationOptions}${
        ' ' + wazuhPasswordParamWithValue
      }" > /tmp/wazuh_envs && `
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
