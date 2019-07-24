import expect from '@kbn/expect';

export default function({ getService, getPageObjects }) {
  const testSubjects = getService('testSubjects');

  describe('reporting', () => {

    before(async () => {
        await testSubjects.click('managementWelcomeReporting');
    });

  });
}