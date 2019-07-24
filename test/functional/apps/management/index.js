export default function ({ getService, loadTestFile, getPageObjects }) {
  const browser = getService('browser');
  const PageObjects = getPageObjects(['common',]);
  const testSubjects = getService('testSubjects');

  describe('Management', () => {

    before(async () => {
      await browser.setWindowSize(1200, 800);
      await PageObjects.common.navigateToApp('wazuh');
      await PageObjects.common.waitUntilUrlIncludes('tab=welcome');
      await testSubjects.click('wzMenuManagement');
    });
    
    loadTestFile(require.resolve('./_welcome'))
    loadTestFile(require.resolve('./_reporting'))
  });
}