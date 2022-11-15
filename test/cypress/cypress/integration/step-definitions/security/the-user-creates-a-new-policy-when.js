import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../utils/driver';
import { POLICY_PAGE as pageName } from '../../utils/pages-constants';
const createPolicyButton = getSelector('createPolicyButton', pageName);

When('the user creates a new policy', () => {
  elementIsVisible(createPolicyButton);
  clickElement(createPolicyButton);
});
