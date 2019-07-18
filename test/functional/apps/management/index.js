export default function ({ getService, loadTestFile }) {
  const browser = getService('browser');

  describe('Overview ', function () {
    this.tags(['smoke']);

    before(async function () {
      await browser.setWindowSize(1200, 800);
    });
    
    loadTestFile(require.resolve('./_welcome')); // Load the _welcome tests
  });
}