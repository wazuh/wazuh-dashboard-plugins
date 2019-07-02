import expect from '@kbn/expect';

export default function({ getPageObjects }) {
  const PageObjects = getPageObjects(['common']);

  describe('Health check', function describeIndexTests() {

    it('complete test check and load overview', async ()=> {
      await PageObjects.common.navigateToApp('wazuh');
    })
  })
}