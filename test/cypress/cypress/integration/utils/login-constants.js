import { loginXpack } from '../step-definitions/login/login-xpack';
import { loginOdfe } from '../step-definitions/login/login-odfe';
import { loginBasic } from '../step-definitions/login/login-basic';
import { loginWzd } from '../step-definitions/login/login-wzd';

export const LOGIN_TYPE = {
  xpack: () => loginXpack(),
  odfe: () => loginOdfe(),
  basic: () => loginBasic(),
  wzd: () => loginWzd()
};

export const ODFE_PASSWORD = 'admin';
export const ODFE_USERNAME = 'admin';
export const OVERVIEW_URL = '/overview/';
export const XPACK_PASSWORD = 'elastic';
export const XPACK_USERNAME = 'elastic';
export const WZD_PASSWORD = 'SecretPassword';
export const WZD_USERNAME = 'admin';
