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
      const toastsText = await euiGlobalToastsList.getVisibleText();
      if(toastsText.includes(str)){
        return true
      }
      return false
    }

    async closeAllToasts () {
      const euiGlobalToastsButtonList = await find.allByCssSelector('div.euiGlobalToastList > div > button');
      for (const closeButton of euiGlobalToastsButtonList) {
        closeButton.click();        
      }
    }

    async anyTypeToasts (type) {
      const euiGlobalToastList = await find.allByCssSelector('div.euiGlobalToastsList > div');
      for (const toast in euiGlobalToastList){
        const classList = await toast.getAttribute('class');
        if (classList.includes(type)){
          return true;
        }
      }
      return false;
    }

  }
  return new ToastsPage;
}