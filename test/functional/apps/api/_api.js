
import expect from '@kbn/expect';

export default function ({ getService, getPageObjects }) {
  const PageObjects = getPageObjects(['common', 'api']);
  const testSubjects = getService('testSubjects');
  const browser = getService('browser');

  describe('API settings', function describeIndexTests() {
    this.tags('smoke');

    before(async function () {
      await PageObjects.common.navigateToApp('wazuh');
    });

    it('should take you to Settings and warn you there are no API credentials available', async () => {
      expect(await browser.getCurrentUrl()).to.contain('app/wazuh#/settings?_g=()&tab=api');
    });

    it('should appear "No API" on the top right corner', async () => {
      expect(await testSubjects.isDisplayed('wzMenuTheresNoAPI')).to.be.ok();
    })

    it('Should appear the index pattern on the top right corner', async () => {
      expect(await testSubjects.isDisplayed('wzMenuOnePattern')).to.be.ok();
    })

    it('the extensions tab should be disabled', async () => {
      await PageObjects.api.checkTabDisabled('wzMenuOverview');
      await PageObjects.api.checkTabDisabled('wzMenuManagement');
      await PageObjects.api.checkTabDisabled('wzMenuAgents');
      await PageObjects.api.checkTabDisabled('wzMenuDiscover');
      await PageObjects.api.checkTabDisabled('wzMenuDevTools');
    })

    describe('Filling "Add API" form badly once per every form field', function describeIndexTests() {
      this.tags('smoke');

      it('should give error with empty user', async () => {
        await testSubjects.click('apiConfigButton');
        await PageObjects.common.sleep(1000);
        await PageObjects.api.findMessageInToasts('Settings. Invalid user field');
      });

      it('should give error with empty password', async () => {
        await testSubjects.setValue('apiConfigUsername', 'foo');
        await testSubjects.click('apiConfigButton');
        await PageObjects.common.sleep(1000);
        await PageObjects.api.findMessageInToasts('Settings. Invalid password field');
      });

      it('should give error with empty host', async () => {
        await testSubjects.setValue('apiConfigPassword', 'bar');
        await testSubjects.click('apiConfigButton');
        await PageObjects.common.sleep(1000);
        await PageObjects.api.findMessageInToasts('Settings. Invalid url field');
      });

      it('should give error with not http/s url host', async () => {
        await testSubjects.setValue('apiConfigHost', 'localhost');
        await testSubjects.click('apiConfigButton');
        await PageObjects.common.sleep(1000);
        await PageObjects.api.findMessageInToasts('Settings. Invalid url field');
      });

      it('should give error with negative port', async () => {
        await testSubjects.setValue('apiConfigHost', 'http://localhost');
        await testSubjects.setValue('apiConfigPort', '-1');
        await testSubjects.click('apiConfigButton');
        await PageObjects.common.sleep(1000);
        await PageObjects.api.findMessageInToasts('Settings. Invalid port field');
      });

      it('should give error with port out of range', async () => {
        await testSubjects.setValue('apiConfigPort', '999999999999');
        await testSubjects.click('apiConfigButton');
        await PageObjects.common.sleep(1000);
        await PageObjects.api.findMessageInToasts('Settings. Invalid port field');
      });


    });

    describe('Filling "Add API" form correctly', function describeIndexTests() {
      this.tags('smoke');

      before(async function () {
        await PageObjects.api.completeApiForm();
      });

      it('Should connect successfully and show the data in the upper right corner', async () => {
        expect(await testSubjects.isDisplayed('wzMenuTheresAPI')).to.be.ok();
      });

      it('Check manager button right after inserting API credentials. Should success and not modify anything on the fields', async () => {
        await testSubjects.click('apiTableRefreshButton');
        await PageObjects.api.findMessageInToasts('Settings. Connection success');
      });

    });

  });
}