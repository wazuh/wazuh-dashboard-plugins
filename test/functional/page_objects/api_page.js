export function ApiProvider({ getService, getPageObjects }) {
    const log = getService('log');
    const PageObjects = getPageObjects(['header', 'common']);
    const testSubjects = getService('testSubjects');
  
    class ApiPage {
        async completeApiForm () {
            await testSubjects.setValue('apiConfigUsername', 'foo');
            log.debug('insert the user');
            await testSubjects.setValue('apiConfigPassword', 'bar');
            log.debug('insert the password');
            await testSubjects.setValue('apiConfigHost', 'http://localhost');
            log.debug('insert the host');
            await testSubjects.setValue('apiConfigPort', '55000');
            log.debug('insert the port');
            await testSubjects.click('apiConfigButton');
            log.debug('click in the button to send the values');
            await PageObjects.common.sleep(2000);
        }
    }
    return new ApiPage;
}