export const getPasswordForCommand = (
  password: string,
  wrapperType: 'doublequote' | 'singlequote',
) => {
  // when the password contains the same wrapper type, we need to escape it
  const escapedPassword = password.replace(
    new RegExp(`\\${wrapperType}`, 'g'),
    `\\${wrapperType}`,
  );
  return escapedPassword;
};
