import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement ,elementIsVisible, getSelector } from '../../../utils/driver';
import {GROUPS_PAGE as pageName} from '../../../utils/pages-constants';
const editGroups = getSelector('editGroups', pageName);

When('The user selects a group to edit', () => {
  elementIsVisible(editGroups);
  clickElement(editGroups);
});
