export default function ({ getService, loadTestFile }) {
  const browser = getService('browser');

  describe('Overview ', () => {

    before(async () => {
      await browser.setWindowSize(1200, 800);
    });
    
    loadTestFile(require.resolve('./_welcome')); // Load the _welcome tests
  });
}