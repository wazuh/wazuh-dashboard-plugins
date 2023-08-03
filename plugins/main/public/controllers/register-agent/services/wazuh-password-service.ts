export const getPasswordWithScapedSpecialCharacters = (
  password: string
) => {
  let passwordScaped = password;
  // the " characters is scaped by default in the password retrieved from the API
  const specialCharsList = ["'", "`"];
  const regex = new RegExp(`[${specialCharsList.join('')}]`, 'g');
  return passwordScaped.replace(regex, `\\$&`);
};