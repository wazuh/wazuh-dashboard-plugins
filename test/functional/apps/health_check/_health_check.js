import expect from '@kbn/expect';

export default function({ getService, getPageObjects }) {
  const browser = getService('browser');
  const PageObjects = getPageObjects(['common', 'api']);

  describe('Health check', function describeIndexTests() {
    before(async function () {
      await PageObjects.common.navigateToApp('wazuh');
      const currentUrl = await browser.getCurrentUrl();
      console.log(currentUrl);
      if(currentUrl.includes('#/settings')){
        await PageObjects.api.completeApiForm();
      }
    });

    it('complete test check and load overview', async ()=> {
      await PageObjects.common.navigateToApp('wazuh');
      await PageObjects.common.waitUntilUrlIncludes('app/wazuh#/overview/');

      expect(await browser.getCurrentUrl()).to.contain('app/wazuh#/overview/');
    })
  })
}