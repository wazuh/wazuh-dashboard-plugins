import { TOperatingSystem } from '../hooks/use-enroll-agent-commands.test';

export const scapeSpecialCharsForLinux = (password: string) => {
  const passwordScaped = password;
  // the " characters is scaped by default in the password retrieved from the API
  const specialCharsList = ["'"];
  const regex = new RegExp(`([${specialCharsList.join('')}])`, 'g');

  // the single quote is escaped first, and then any unescaped backslashes are escaped
  return passwordScaped
    .replaceAll(regex, `'"$&"'`)
    .replaceAll(/(?<!\\)\\(?!["\\])/g, '\\\\');
};

export const scapeSpecialCharsForMacOS = (password: string) => {
  const passwordScaped = password;

  // The double quote is escaped first and then the backslash followed by a single quote
  return (
    passwordScaped
      // eslint-disable-next-line no-useless-escape
      .replaceAll(String.raw`\"`, '\\\"')
      // eslint-disable-next-line no-useless-escape
      .replaceAll(String.raw`\'`, `\\'\"'\"'`)
  );
};

export const scapeSpecialCharsForWindows = (password: string) => {
  const passwordScaped = password;
  // the " characters is scaped by default in the password retrieved from the API
  const specialCharsList = ["'"];
  const regex = new RegExp(`([${specialCharsList.join('')}])`, 'g');

  // the single quote is escaped first, and then any unescaped backslashes are escaped
  return passwordScaped
    .replaceAll(regex, `'"$&"'`)
    .replaceAll(/(?<!\\)\\(?!["\\])/g, '\\');
};

export const obfuscatePasswordInCommand = (
  password: string,
  commandText: string,
  os: TOperatingSystem['name'],
): string => {
  const command = commandText;
  const osName = os?.toLocaleLowerCase();

  switch (osName) {
    case 'macos': {
      const regex = /--password\s'((?:\\'|[^']|["'])*)'/g;
      const replacedString = command.replaceAll(regex, (match, capturedGroup) =>
        match.replace(capturedGroup, '*'.repeat(capturedGroup.length)),
      );

      return replacedString;
    }

    case 'windows': {
      const replacedString = command.replace(
        `--password '${scapeSpecialCharsForWindows(password)}'`,
        () =>
          `--password '${'*'.repeat(scapeSpecialCharsForWindows(password).length)}'`,
      );

      return replacedString;
    }

    case 'linux': {
      const replacedString = command.replace(
        `--password $'${scapeSpecialCharsForLinux(password)}'`,
        () =>
          `--password $'${'*'.repeat(scapeSpecialCharsForLinux(password).length)}'`,
      );

      return replacedString;
    }

    default: {
      return commandText;
    }
  }
};
