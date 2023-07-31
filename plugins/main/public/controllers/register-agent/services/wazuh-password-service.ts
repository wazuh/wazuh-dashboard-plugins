export const getPasswordForCommand = (
  password: string,
  wrapperType: 'doublequote' | 'singlequote',
) => {


  if(wrapperType === 'doublequote') {
    // scape doublequote in password
    return password.replace(/"/g, '\"');
  } else {
    // scape singlequote in password
    return password.replace(/'/g, "\'");
  }
};
