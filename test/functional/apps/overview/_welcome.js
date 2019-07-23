import expect from '@kbn/expect';

export default function({ getService, getPageObjects }) {
  const browser = getService('browser');
  const PageObjects = getPageObjects([ 'common', 'api' ]);
  const popOver = getService('popOver');
  const testSubjects = getService('testSubjects');


  describe('welcome', () => {

    before(async function () {
      await PageObjects.common.navigateToApp('wazuh');
      await PageObjects.common.waitUntilUrlIncludes('tab=welcome');
    });

    it('complete test check and load overview', async () => {
      expect(await browser.getCurrentUrl()).to.contain('tab=welcome');
    });

    it('should be marked the switch of aws extension when clicking this', async () => {
      const result = await popOver.checkedPopover('switchAws', 'eyePopoverSecurity');
      expect(result).to.be.ok();
    });

    it('should be enabled the aws extension', async () => {
      expect(testSubjects.exists('overviewWelcomeAws')).to.be.ok();
    });

    it('after reload the browser should be enabled', async () => {
      browser.refresh();
      expect(testSubjects.exists('overviewWelcomeAws')).to.be.ok();
    });

    it('should not be enabled when change the api', async () => {
      await PageObjects.api.insertNewApi();
      expect(await testSubjects.exists('overviewWelcomeAws')).to.not.be.ok();
    });

    it('should be enabled when return to the last api', async () => {
      await PageObjects.api.deleteNewApi();
      while(!await testSubjects.exists('overviewWelcomeAws')){}
      expect(true).to.be.ok();
    });

  });
}