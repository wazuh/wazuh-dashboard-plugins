import { ODFE_PASSWORD, ODFE_USERNAME } from '../../utils/login-constants';
import {
  buttonSubmitSelector,
  inputPasswordSelector,
  inputUsernameSelector,
} from '../../pageobjects/login/odef-login.page';
import { clickElement, fillField } from '../../utils/driver';

const fillUsernameFieldODFE = (userName) => {
  fillField(inputUsernameSelector, userName);
  return this;
};

const fillPasswordFieldODFE = (password) => {
  fillField(inputPasswordSelector, password);
  return this;
};

const clickSubmitButtonODFE = () => {
  clickElement(buttonSubmitSelector);
};

const loginOdfe = () => {
  fillUsernameFieldODFE(ODFE_USERNAME);
  fillPasswordFieldODFE(ODFE_PASSWORD);
  clickSubmitButtonODFE();
};

export { loginOdfe };
