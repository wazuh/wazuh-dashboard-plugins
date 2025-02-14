import { TOptionalParameters } from '../core/config/os-commands-definitions';
import {
  IOptionalParameters,
  TOSEntryInstallCommand,
  TOSEntryProps,
} from '../core/enroll-commands/types';
import { TOperatingSystem } from '../hooks/use-enroll-agent-commands.test';

export const getAllOptionals = (
  optionals: IOptionalParameters<TOptionalParameters>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  osName?: TOperatingSystem['name'],
) => {
  // create paramNameOrderList, which is an array of the keys of optionals add interface
  const paramNameOrderList: (keyof IOptionalParameters<TOptionalParameters>)[] =
    [
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ];

  if (!optionals) {
    return '';
  }

  return Object.values(paramNameOrderList)
    .map(key => optionals[key])
    .filter(Boolean)
    .join(' ');
};

export const getAllOptionalsMacos = (
  optionals: IOptionalParameters<TOptionalParameters>,
) => {
  // create paramNameOrderList, which is an array of the keys of optionals add interface
  const paramNameOrderList: (keyof IOptionalParameters<TOptionalParameters>)[] =
    [
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ];

  if (!optionals) {
    return '';
  }

  return Object.values(paramNameOrderList)
    .map(key => optionals[key])
    .filter(Boolean)
    .join(' ');
};

/** ***** DEB *******/

export const getDEBAMD64InstallCommand = (
  props: TOSEntryInstallCommand<TOptionalParameters>,
) => {
  const { optionals, wazuhVersion } = props;
  const packageName = `wazuh-agent_${wazuhVersion}-1_amd64.deb`;

  return [
    // `wget ${urlPackage}`, // TODO: enable when the packages are publically hosted
    `sudo dpkg -i ./${packageName}`,
    `sudo /usr/share/wazuh-agent/bin/wazuh-agent --register-agent ${optionals && getAllOptionals(optionals)}`,
  ].join(' && ');
};

export const getDEBARM64InstallCommand = (
  props: TOSEntryInstallCommand<TOptionalParameters>,
) => {
  const { optionals, wazuhVersion } = props;
  const packageName = `wazuh-agent_${wazuhVersion}-1_arm64.deb`;

  return [
    // `wget ${urlPackage}`, // TODO: enable when the packages are publically hosted
    `sudo dpkg -i ./${packageName}`,
    `sudo /usr/share/wazuh-agent/bin/wazuh-agent --register-agent ${optionals && getAllOptionals(optionals)}`,
  ].join(' && ');
};

/** ***** RPM *******/

export const getRPMAMD64InstallCommand = (
  props: TOSEntryInstallCommand<TOptionalParameters>,
) => {
  const { optionals, wazuhVersion } = props;
  const packageName = `wazuh-agent-${wazuhVersion}-1.x86_64.rpm`;

  return [
    // `curl -o ${packageName} ${urlPackage}`, // TODO: enable when the packages are publically hosted
    `sudo rpm -ihv ${packageName}`,
    `sudo /usr/share/wazuh-agent/bin/wazuh-agent --register-agent ${optionals && getAllOptionals(optionals)}`,
  ].join(' && ');
};

export const getRPMARM64InstallCommand = (
  props: TOSEntryInstallCommand<TOptionalParameters>,
) => {
  const { optionals, wazuhVersion } = props;
  const packageName = `wazuh-agent-${wazuhVersion}-1.aarch64.rpm`;

  return [
    // `curl -o ${packageName} ${urlPackage}`, // TODO: enable when the packages are publically hosted
    `sudo rpm -ihv ${packageName}`,
    `sudo /usr/share/wazuh-agent/bin/wazuh-agent --register-agent ${optionals && getAllOptionals(optionals)}`,
  ].join(' && ');
};

/** ***** Linux *******/

// Start command
export const getLinuxStartCommand = (
  _props: TOSEntryProps<TOptionalParameters>,
) =>
  `sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent`;

/** ****** Windows ********/

export const getWindowsInstallCommand = (
  props: TOSEntryInstallCommand<TOptionalParameters>,
) => {
  const { optionals, name } = props;

  return [
    // `Invoke-WebRequest -Uri ${urlPackage} -OutFile \$env:tmp\\wazuh-agent;`, // TODO: enable when the packages are publically hosted
    // https://stackoverflow.com/questions/1673967/how-to-run-an-exe-file-in-powershell-with-parameters-with-spaces-and-quotes
    `Start-Process msiexec.exe "/i $env:tmp\\wazuh-agent /q" -Wait; & 'C:\\Program Files\\wazuh-agent\\wazuh-agent.exe' --register-agent ${
      optionals && getAllOptionals(optionals, name)
    }`,
  ].join(' ');
};

export const getWindowsStartCommand = (
  _props: TOSEntryProps<TOptionalParameters>,
) => `NET START 'Wazuh Agent'`;

/** ****** MacOS ********/

export const transformOptionalsParamatersMacOSCommand = (command: string) =>
  command
    .replaceAll(/' ([A-Za-z])/g, "' && $1") // Separate environment variables with &&
    .replaceAll('"', String.raw`\"`) // Escape double quotes
    .trim();

export const getMacOsInstallCommand = (
  props: TOSEntryInstallCommand<TOptionalParameters>,
) => {
  const { optionals } = props;
  const optionalsForCommand = { ...optionals };

  if (optionalsForCommand?.password) {
    /**
     * We use the JSON.stringify to prevent that the scaped specials characters will be removed
     * and maintain the format of the password
      The JSON.stringify maintain the password format but adds " to wrap the characters
    */
    const scapedPasswordLength = JSON.stringify(
      optionalsForCommand?.password,
    ).length;

    // We need to remove the " added by JSON.stringify
    optionalsForCommand.password = `${JSON.stringify(
      optionalsForCommand?.password,
    ).slice(1, scapedPasswordLength - 1)}`;
  }

  // Set macOS installation script with environment variables
  const optionalsText =
    optionalsForCommand && getAllOptionals(optionalsForCommand);
  const macOSInstallationOptions = transformOptionalsParamatersMacOSCommand(
    optionalsText || '',
  );
  // Merge environment variables with installation script
  const macOSInstallationScript = [
    // `curl -so wazuh-agent.pkg ${urlPackage}`,
    'sudo installer -pkg ./wazuh-agent.pkg -target /',
    `/Library/Application\\ Support/Wazuh\\ agent.app/bin/wazuh-agent --register-agent ${macOSInstallationOptions}`,
  ].join(' && ');

  return macOSInstallationScript;
};

export const getMacosStartCommand = (
  _props: TOSEntryProps<TOptionalParameters>,
) => `sudo /Library/Ossec/bin/wazuh-control start`;
