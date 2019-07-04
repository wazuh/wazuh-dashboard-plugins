import expect from '@kbn/expect';

export function ToastsProvider({ getService, getPageObjects }) {
  const browser = getService('browser');
  const find = getService('find');
  const log = getService('log');
  const PageObjects = getPageObjects(['header', 'common']);
  const testSubjects = getService('testSubjects');

  class ToastsPage {

    async findMessageInToasts (str) {
      const euiGlobalToastsList = await find.byCssSelector('div.euiGlobalToastList');
      expect(await euiGlobalToastsList.getVisibleText()).to.contain(str);
    }

    async closeAllToasts () {
      const euiGlobalToastsButtonList = await find.allByCssSelector('div.euiGlobalToastList > div > button');
      for (const key in euiGlobalToastsButtonList) {
        if (euiGlobalToastsButtonList.hasOwnProperty(key)) {
          const closeButton = euiGlobalToastsButtonList[key];
          closeButton.click();
        }
      }
    }

  }
  return new ToastsPage;
}