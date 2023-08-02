export const getPasswordWithScapedSpecialCharacters = (
  password: string
) => {
  let passwordScaped = password;
  // the " characters is scaped by default in the password retrieved from the API
  const specialCharsList = ["'"];
  specialCharsList.forEach((specialChar) => {
    // scape every special character defined in specialCharList with a backslash
    passwordScaped = passwordScaped.replace(
      new RegExp(specialChar, 'g'),
      `\\${specialChar}`
    );
  });
  return passwordScaped;
};