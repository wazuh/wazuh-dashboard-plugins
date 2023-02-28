import { elementIsVisible, getSelector } from '../../../utils/driver';

import { ABOUT_PAGE as pageName} from '../../../utils/pages-constants';
const appRevisionNumber = getSelector('appRevisionNumber', pageName);
const appRevisionTitle = getSelector('appRevisionTitle', pageName);
const appVersionNumber = getSelector('appVersionNumber', pageName);
const appVersionTitle = getSelector('appVersionTitle', pageName);
const communityCard = getSelector('communityCard', pageName);
const communityCardTitle = getSelector('communityCardTitle', pageName);
const communityGithubLink = getSelector('communityGithubLink', pageName);
const communityGoogleGroupLink = getSelector('communityGoogleGroupLink', pageName);
const communitySlackLink = getSelector('communitySlackLink', pageName);
const installDateInformation = getSelector('installDateInformation', pageName);
const installDateTitle = getSelector('installDateTitle', pageName);
const welcomingCard = getSelector('welcomingCard', pageName);
const welcomingCardTitle = getSelector('welcomingCardTitle', pageName);

Then('The Wazuh information is displayed', () => {
  elementIsVisible(appVersionTitle);
  elementIsVisible(appVersionNumber);

  elementIsVisible(appRevisionTitle);
  elementIsVisible(appRevisionNumber);

  elementIsVisible(installDateTitle);
  elementIsVisible(installDateInformation);

  elementIsVisible(welcomingCard);
  elementIsVisible(welcomingCardTitle);

  elementIsVisible(communityCard);
  elementIsVisible(communityCardTitle);
  elementIsVisible(communitySlackLink);
  elementIsVisible(communityGoogleGroupLink);
  elementIsVisible(communityGithubLink);
});
