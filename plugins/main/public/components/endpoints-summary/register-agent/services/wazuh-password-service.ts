import { tOperatingSystem } from "../hooks/use-register-agent-commands.test";

export const scapeSpecialCharsForLinux = (password: string) => {
  let passwordScaped = password;
  // the " characters is scaped by default in the password retrieved from the API
  const specialCharsList = ["'"];
  const regex = new RegExp(`([${specialCharsList.join('')}])`, 'g');
  // the single quote is escaped first, and then any unescaped backslashes are escaped
  return passwordScaped.replace(regex, `\'\"$&\"\'`).replace(/(?<!\\)\\(?!["\\])/g, '\\\\');
};

export const scapeSpecialCharsForMacOS = (password: string) => {
  let passwordScaped = password;
  // The double quote is escaped first and then the backslash followed by a single quote
  return passwordScaped.replace(/\\"/g, '\\\"').replace(/\\'/g, `\\'\"'\"'`);
}

export const scapeSpecialCharsForWindows = (password: string) => {
  let passwordScaped = password;
  // the " characters is scaped by default in the password retrieved from the API
  const specialCharsList = ["'"];
  const regex = new RegExp(`([${specialCharsList.join('')}])`, 'g');
  // the single quote is escaped first, and then any unescaped backslashes are escaped
  return passwordScaped.replace(regex, `\'\"$&\"\'`).replace(/(?<!\\)\\(?!["\\])/g, '\\');
};

export const osdfucatePasswordInCommand = (password: string, commandText: string, os: tOperatingSystem['name']): string => {
  let command = commandText;
  const osName = os?.toLocaleLowerCase();
  switch (osName){
    case 'macos':
    {
      const regex = /WAZUH_REGISTRATION_PASSWORD=\'((?:\\'|[^']|[\"'])*)'/g;
      const replacedString = command.replace(
        regex,
        (match, capturedGroup) => {
          return match.replace(
            capturedGroup,
            '*'.repeat(capturedGroup.length),
          );
        }
      );
    return replacedString;
    }
    case 'windows':
      {
        const replacedString = command.replace(
          `WAZUH_REGISTRATION_PASSWORD=\'${scapeSpecialCharsForWindows(password)}'`,
          () => {
            return `WAZUH_REGISTRATION_PASSWORD=\'${'*'.repeat(scapeSpecialCharsForWindows(password).length)}\'`;
          }
        );
        return replacedString;
      }
    case 'linux':
    {
      const replacedString = command.replace(
        `WAZUH_REGISTRATION_PASSWORD=\$'${scapeSpecialCharsForLinux(password)}'`,
        () => {
          return `WAZUH_REGISTRATION_PASSWORD=\$\'${'*'.repeat(scapeSpecialCharsForLinux(password).length)}\'`;
        }
      );
      return replacedString;
    }
    default:
      return commandText;
  }
}