export const getPasswordWithScapedSpecialCharacters = (password: string) => {
  let passwordScaped = password;
  // the " characters is scaped by default in the password retrieved from the API
  const specialCharsList = ["'"];
  const regex = new RegExp(`([${specialCharsList.join('')}])`, 'g');
  // the single quote is escaped first, and then any unescaped backslashes are escaped
  return passwordScaped.replace(regex, `\'\"$&\"\'`).replace(/(?<!\\)\\(?!["\\])/g, '\\\\');
};