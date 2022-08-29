import { WZD_PASSWORD, WZD_USERNAME } from '../../utils/login-constants';
import {
  buttonSubmitSelector,
  inputPasswordSelector,
  inputUsernameSelector,
} from '../../pageobjects/login/wzd-login.page';
import { clickElement, fillField } from '../../utils/driver';

const fillUsernameFieldWzd = (userName) => {
  fillField(inputUsernameSelector, userName);
  return this;
};

const fillPasswordFieldWzd = (password) => {
  fillField(inputPasswordSelector, password);
  return this;
};

const clickSubmitButtonWzd = () => {
  clickElement(buttonSubmitSelector);
};

const loginWzd = () => {
  fillUsernameFieldWzd(WZD_USERNAME);
  fillPasswordFieldWzd(WZD_PASSWORD);
  clickSubmitButtonWzd();
};

export { loginWzd };
