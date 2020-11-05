import expect from '@kbn/expect';

export function ApiProvider({ getService, getPageObjects }) {
  const browser = getService('browser');
  const find = getService('find');
  const log = getService('log');
  const PageObjects = getPageObjects(['header', 'common']);
  const testSubjects = getService('testSubjects');
  const toasts = getService('toasts');

  /**
   * The Api Page class provides functions to automate the process
   * of testing the API configuration
   *
   * @class ApiPage
   */
  class ApiPage {
    /**
     * Complete the form to create a new Api connection.
     *
     * @param {string} [type='apiConfig'] Set the form type
     *  - apiConfig: For new API form
     *  - apiTableEdit: For edit API form
     * @memberof ApiPage
     */
    async completeApiForm(type = 'apiConfig') {
      if (!(type == 'apiConfig' || type == 'apiTableEdit')) {
        throw new Error(
          `Invalid type: ${type}; use 'apiConfig' or 'apiTableEdit'`
        );
      }
      await testSubjects.setValue(`${type}Username`, 'wazuh');
      log.debug('insert the user');
      await testSubjects.setValue(`${type}Password`, 'wazuh');
      log.debug('insert the password');
      await testSubjects.setValue(`${type}Host`, 'http://localhost');
      log.debug('insert the host');
      await testSubjects.setValue(`${type}Port`, '55000');
      log.debug('insert the port');
      await testSubjects.click(`${type}SaveButton`);
      log.debug('click in the button to send the values');
      await PageObjects.common.sleep(2000);
    }

    /**
     * Check the menu tab status
     *
     * @param {string} tab testSubjects value
     * @memberof ApiPage
     */
    async checkTabDisabled(tab) {
      await testSubjects.click(tab);
      await PageObjects.common.sleep(1500);
      expect(await browser.getCurrentUrl()).to.contain('tab=api');
      expect(await browser.getCurrentUrl()).to.contain('app/wazuh#/settings');
    }

    /**
     * Check all menu tabs status
     *
     * @memberof ApiPage
     */
    async checkIfAllTabsAreDisables() {
      await this.checkTabDisabled('wzMenuOverview');
      await this.checkTabDisabled('wzMenuManagement');
      await this.checkTabDisabled('wzMenuAgents');
      await this.checkTabDisabled('wzMenuDiscover');
      await this.checkTabDisabled('wzMenuDevTools');
    }

    /**
     * Press all refresh buttons of the API list and
     * the response in the toasts
     *
     * @param {array} buttonList list of button WebElementWrapper
     * @memberof ApiPage
     */
    async pressAllCheckConnectionButtons(buttonList) {
      for (const key in buttonList) {
        if (buttonList.hasOwnProperty(key)) {
          const checkButton = buttonList[key];
          await checkButton.moveMouseTo();
          await PageObjects.common.sleep(1000);
          await checkButton.click();
          await PageObjects.common.sleep(2000);
          expect(
            await toasts.findMessageInToasts('Settings. Connection success')
          ).to.be.ok();
          await PageObjects.common.clearAllToasts();
        }
      }
    }

    /**
     * Edit all APIs in the table of settings
     *
     * @param {array} apiButtonList list of button WebElementWrapper
     * @memberof ApiPage
     */
    async editAllApis(apiButtonList) {
      for (const apiButton of apiButtonList) {
        await apiButton.moveMouseTo();
        await PageObjects.common.sleep(1000);
        await apiButton.click();
        await this.completeApiForm('apiTableEdit');
        expect(
          await toasts.findMessageInToasts(
            'Settings. The API was updated successfully'
          )
        ).to.be.ok();
        await PageObjects.common.clearAllToasts();
      }
    }

    /**
     * Press all the trash buttons in the table of settings
     *
     * @memberof ApiPage
     */
    async deleteAllApis() {
      const deleteApiButtonList = await testSubjects.findAll(
        'apiTableTrashButton'
      );
      for (const deleteButton of deleteApiButtonList) {
        await deleteButton.moveMouseTo();
        await PageObjects.common.sleep(1000);
        await deleteButton.click();
        await PageObjects.common.sleep(1500);
        expect(
          await toasts.findMessageInToasts(
            'Settings. The API was removed successfully'
          )
        ).to.be.ok();
        await PageObjects.common.clearAllToasts();
      }
    }

    /**
     * Navigate to API view in settings
     *
     * @memberof ApiPage
     */
    async navigateToApiSetting() {
      await testSubjects.click('wzMenuSettings');
      await testSubjects.click('settingMenuApi');
    }

    /**
     * Go to the API settings, insert a new API and set it as default
     *
     * @memberof ApiPage
     */
    async insertNewApi() {
      const fromUrl = await browser.getCurrentUrl();
      await this.navigateToApiSetting();
      await testSubjects.click('apiTableAddButton');
      await this.completeApiForm();
      await find.clickByCssSelector('[test-api-default="false"]');
      await browser.get(fromUrl);
      await PageObjects.common.waitUntilUrlIncludes('tab=welcome');
    }

    /**
     * Go to the API settings, delete the new API
     *
     * @memberof ApiPage
     */
    async deleteNewApi() {
      const fromUrl = await browser.getCurrentUrl();
      await this.navigateToApiSetting();
      await PageObjects.common.sleep(500);
      await this.clickTrashDefaultApi();
      await browser.get(fromUrl);
      await PageObjects.common.waitUntilUrlIncludes('tab=welcome');
    }

    /**
     * Remove the API marked as default
     *
     * @returns
     * @memberof ApiPage
     */
    async clickTrashDefaultApi() {
      const rows = await find.allByCssSelector('table>tbody>tr');
      for (const row of rows) {
        try {
          await row.findByCssSelector('[test-api-default="true"]');
          const trashButton = await row.findByCssSelector(
            '[data-test-subj="apiTableTrashButton"]'
          );
          await trashButton.click();
          return;
        } catch (error) {}
      }
    }
  }
  return new ApiPage();
}
