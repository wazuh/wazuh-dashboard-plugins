export function WazuhCommonProvider({ getService, getPageObjects }) {
  const appsMenu = getService('appsMenu');
  const browser = getService('browser');
  const log = getService('log');
  const PageObjects = getPageObjects(['common']);
  const testSubjects = getService('testSubjects');

  class WazuhCommonPage {
    async OpenSecurityEvents () {
      log.debug('Open Security events')
      await PageObjects.common.navigateToApp('settings');
      await appsMenu.clickLink('Wazuh');
      await appsMenu.clickLink('Wazuh');
      await testSubjects.click('overviewWelcomeGeneral');
    }
  }
  return new WazuhCommonPage;
}