
import expect from '@kbn/expect';

export default function ({ getService, getPageObjects }) {
  const PageObjects = getPageObjects(['common', 'api', 'toasts']);
  const testSubjects = getService('testSubjects');
  const browser = getService('browser');

  describe('API', () => {

    before(async () => {
      await PageObjects.common.navigateToApp('wazuh');
      const currentUrl = await browser.getCurrentUrl();
      if(currentUrl.includes('#/overview') || currentUrl.includes('#/health-check')){
        await PageObjects.common.waitUntilUrlIncludes('overview');
        await testSubjects.click('wzMenuSettings');
        await testSubjects.click('settingMenuApi');
        await PageObjects.api.deleteAllApis();
      }
    });

    it('should take you to Settings and warn you there are no API credentials available', async () => {
      expect(await browser.getCurrentUrl()).to.contain('app/wazuh#/settings?_g=()&tab=api');
    });

    it('should appear "No API" on the top right corner', async () => {
      expect(await testSubjects.isDisplayed('wzMenuTheresNoAPI')).to.be.ok();
    });

    it('Should appear the index pattern on the top right corner', async () => {
      expect(await testSubjects.isDisplayed('wzMenuOnePattern')).to.be.ok();
    });

    it('the extensions tabs should be disabled before add the api', async () => {
      await PageObjects.api.checkIfAllTabsAreDisables();
    });

    it('should give error when insert empty user', async () => {
      await testSubjects.click('apiConfigSaveButton');
      await PageObjects.common.sleep(1500);
      expect(await PageObjects.toasts.findMessageInToasts('Settings. Invalid user field')).to.be.ok();
    });

    it('should give error when insert empty password', async () => {
      await testSubjects.setValue('apiConfigUsername', 'foo');
      await testSubjects.click('apiConfigSaveButton');
      await PageObjects.common.sleep(1500);
      expect(await PageObjects.toasts.findMessageInToasts('Settings. Invalid password field')).to.be.ok();
    });

    it('should give error when insert empty host', async () => {
      await testSubjects.setValue('apiConfigPassword', 'bar');
      await testSubjects.click('apiConfigSaveButton');
      await PageObjects.common.sleep(1500);
      expect(await PageObjects.toasts.findMessageInToasts('Settings. Invalid url field')).to.be.ok();
    });

    it('should give error when insert not http/s url host', async () => {
      await testSubjects.setValue('apiConfigHost', 'localhost');
      await testSubjects.click('apiConfigSaveButton');
      await PageObjects.common.sleep(1500);
      expect(await PageObjects.toasts.findMessageInToasts('Settings. Invalid url field')).to.be.ok();
    });

    it('should give error when insert negative port', async () => {
      await testSubjects.setValue('apiConfigHost', 'http://localhost');
      await testSubjects.setValue('apiConfigPort', '-1');
      await testSubjects.click('apiConfigSaveButton');
      await PageObjects.common.sleep(1500);
      expect(await PageObjects.toasts.findMessageInToasts('Settings. Invalid port field')).to.be.ok();
    });

    it('should give error when insert port out of range', async () => {
      await PageObjects.common.clearAllToasts();
      await testSubjects.setValue('apiConfigPort', '999999999999');
      await testSubjects.click('apiConfigSaveButton');
      await PageObjects.common.sleep(1500);
      expect(await PageObjects.toasts.findMessageInToasts('Settings. Invalid port field')).to.be.ok();
    });

    it('filling "Add API" form correctly', async () => {
      await PageObjects.api.completeApiForm();
    });

    it('Should connect successfully and show the data in the upper right corner', async () => {
      expect(await testSubjects.isDisplayed('wzMenuTheresAPI')).to.be.ok();
    });

    it('Check manager button right after inserting API credentials. Should success and not modify anything on the fields', async () => {
      await testSubjects.click('apiTableRefreshButton');
      await PageObjects.common.sleep(1500);
      expect(await PageObjects.toasts.findMessageInToasts('Settings. Connection success')).to.be.ok();
    });

    it('insert a new API', async () => {
      await testSubjects.click('apiTableAddButton');
      await PageObjects.api.completeApiForm();        
    });

    it('press F5 to reload the page. Should reload properly the currently active tab (Settings)', async () => {
      await browser.refresh();
      await PageObjects.common.sleep(4000);
      expect(await browser.getCurrentUrl()).to.contain('#/settings');
    });

    it('check everyone with the Check button Should not change the currently selected API', async () => {
      const checkButtonList = await testSubjects.findAll('apiTableRefreshButton');
      await PageObjects.api.pressAllCheckConnectionButtons(checkButtonList);
    });

    it('edit an API entry. The API is edited properly', async () => {
      const editApiButtonList = await testSubjects.findAll('apiTableEditButton');
      await PageObjects.api.editAllApis(editApiButtonList); 
    });

    it('delete all APIs should get a confirmation', async () => {
      await PageObjects.api.deleteAllApis();
    });

    it('the extensions tab should be disabled after delete the api', async () => {
      await PageObjects.api.checkIfAllTabsAreDisables();
    });

    it('should appear "No API" again on the top right corner', async () => {
      expect(await testSubjects.isDisplayed('wzMenuTheresNoAPI')).to.be.ok();
    });

  });
}
