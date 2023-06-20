import { Given } from 'cypress-cucumber-preprocessor/steps';
import { navigate, elementIsVisible, getSelector, getCookiesFromBrowser } from '../../utils/driver';
import { WAZUH_MENU_PAGE as pageName } from '../../utils/pages-constants';
const wazuhMenuButton = getSelector('wazuhMenuButton', pageName);
let urlsList = [
  'https://localhost:5601/elastic/samplealerts/security',
  'https://localhost:5601/elastic/samplealerts/auditing-policy-monitoring',
  'https://localhost:5601/elastic/samplealerts/threat-detection',
];
let urlBodys = [
  { alertCount: 27000, index: 'wazuh-alerts-4.x-sample-security' },
  { alertCount: 12000, index: 'wazuh-alerts-4.x-sample-auditing-policy-monitoring' },
  { alertCount: 15000, index: 'wazuh-alerts-4.x-sample-threat-detection' },
];

Given('The wazuh admin user is logged', () => {
  if (Cypress.env('type') != 'wzd') {
    navigate('app/wazuh');
  } else {
    navigate('/');
  }
  elementIsVisible(wazuhMenuButton);
});

Given('The sample data is loaded', () => {
  cy.readFile('cookies.json').then((cookies) => {
    let headersFormat = {
      'content-type': 'application/json; charset=utf-8',
      Cookie: getCookiesFromBrowser(cookies),
      Accept: 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
    };
    Cypress.env('type') == 'xpack'
      ? (headersFormat['kbn-xsrf'] = 'kibana')
      : (headersFormat['osd-xsrf'] = 'kibana');
    for (let i = 0; i < urlsList.length; i++) {
      cy.request({
        method: 'POST',
        url: urlsList[i],
        headers: headersFormat,
        body: urlBodys[i],
      }).should((response) => {
        expect(response.status).to.eq(200);
      });
    }
  });
});
