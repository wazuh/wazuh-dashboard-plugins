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
