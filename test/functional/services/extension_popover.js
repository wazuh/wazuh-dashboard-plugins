

export function ExtensionPopoverProvider({ getService, getPageObjects }) {
  const testSubjects = getService('testSubjects');
  const browser = getService('browser');
  const PageObjects = getPageObjects([ 'common' ]);


  class ExtensionPopover {
    async availablePopovers () {
      const currentUrl = await browser.getCurrentUrl();
      if(currentUrl.includes('tab=welcome')){
        return true;
      }
      throw new Error('The current view has not popovers');
    }

    async checkedPopover (key, popOver) {
      await this.availablePopovers();
      if (await testSubjects.exists(popOver)){
        await testSubjects.click(popOver);
      } else {
        throw new Error(`Error to locate ${popOver}`);                
      }

      if (await testSubjects.exists(key, { allowHidden: true })){
        await testSubjects.click(key);
        const result = await testSubjects.getProperty(key, 'checked');
        return result;
      } else {
        throw new Error(`Error to locate ${key}`);                
      }
    }

  }

  return new ExtensionPopover();
}