export function ToastsProvider({ getService, getPageObjects }) {
  const find = getService('find');

  /**
   * Tools to interact with the toasts elements
   *
   * @class ToastsPage
   */
  class ToastsPage {

    /**
     * Get all the text inside the toasts and check if it includes a string
     *
     * @param {string} str
     * @returns {bool}
     * @memberof ToastsPage
     */
    async findMessageInToasts (str) {
      const euiGlobalToastsList = await find.byCssSelector('div.euiGlobalToastList');
      const toastsText = await euiGlobalToastsList.getVisibleText();
      if(toastsText.includes(str)){
        return true
      }
      return false
    }

    /**
     * Press the close buttons on all active toasts.
     *
     * @memberof ToastsPage
     */
    async closeAllToasts () {
      const euiGlobalToastsButtonList = await find.allByCssSelector('div.euiGlobalToastList > div > button');
      for (const closeButton of euiGlobalToastsButtonList) {
        closeButton.click();        
      }
    }

    /**
     * Return if any of the active toasts has the indicated type.
     *  - success
     *  - warning
     *  - error
     *  - info
     *
     * @param {string} type
     * @returns {bool}
     * @memberof ToastsPage
     */
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