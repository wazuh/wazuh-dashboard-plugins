import expect from '@kbn/expect';

export function ApiProvider({ getService, getPageObjects }) {
  const browser = getService('browser');
  const find = getService('find');
  const log = getService('log');
  const PageObjects = getPageObjects(['header', 'common', 'toasts']);
  const testSubjects = getService('testSubjects');

  class ApiPage {

    async completeApiForm (type='apiConfig') {
      if (!(type == 'apiConfig' || type == 'apiTableEdit')){
        throw new Error(`Invalid type: ${type}; use 'apiConfig' or 'apiTableEdit'`);
      }
      await testSubjects.setValue(`${type}Username`, 'foo');
      log.debug('insert the user');
      await testSubjects.setValue(`${type}Password`, 'bar');
      log.debug('insert the password');
      await testSubjects.setValue(`${type}Host`, 'http://localhost');
      log.debug('insert the host');
      await testSubjects.setValue(`${type}Port`, '55000');
      log.debug('insert the port');
      await testSubjects.click(`${type}SaveButton`);
      log.debug('click in the button to send the values');
      await PageObjects.common.sleep(2000);
    }

    async checkTabDisabled (tab) {
      await testSubjects.click(tab);
      await PageObjects.common.sleep(1500);
      expect(await browser.getCurrentUrl()).to.contain('tab=api');
      expect(await browser.getCurrentUrl()).to.contain('app/wazuh#/settings');
    }

    async checkIfAllTabsAreDisables () {
      await this.checkTabDisabled('wzMenuOverview');
      await this.checkTabDisabled('wzMenuManagement');
      await this.checkTabDisabled('wzMenuAgents');
      await this.checkTabDisabled('wzMenuDiscover');
      await this.checkTabDisabled('wzMenuDevTools');
    }

    async pressAllCheckConnectionButtons (buttonList) {
      for (const key in buttonList) {
        if (buttonList.hasOwnProperty(key)) {
          const checkButton = buttonList[key];
          await checkButton.moveMouseTo();
          await PageObjects.common.sleep(1000);
          await checkButton.click();
          await PageObjects.common.sleep(2000);
          expect(await PageObjects.toasts.findMessageInToasts('Settings. Connection success')).to.be.ok();
          await PageObjects.common.clearAllToasts();
        }
      }
    }

    async editAllApis (apiButtonList) {
      for (const apiButton of apiButtonList) {
        await apiButton.moveMouseTo();
        await PageObjects.common.sleep(1000);
        await apiButton.click();
        await this.completeApiForm('apiTableEdit');
          expect(await PageObjects.toasts.findMessageInToasts('Settings. The API was updated successfully')).to.be.ok();
        await PageObjects.common.clearAllToasts();
      }
    }

    async deleteAllApis (deleteApiButtonList) {
      for (const deleteButton of deleteApiButtonList) {
        await deleteButton.moveMouseTo();
        await PageObjects.common.sleep(1000);
        await deleteButton.click();
        await PageObjects.common.sleep(1500);
        expect(await PageObjects.toasts.findMessageInToasts('Settings. The API was removed successfully')).to.be.ok();
        await PageObjects.common.clearAllToasts();
      }
    }

  }
  return new ApiPage;
}