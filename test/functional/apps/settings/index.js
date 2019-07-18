export default function ({ getService, loadTestFile }) {
  const browser = getService('browser');

  describe('Settings ', function () {
    this.tags(['ciGroup6', 'smoke']);

    before(async function () {
      await browser.setWindowSize(1200, 800);
    });

    loadTestFile(require.resolve('./_api'));
  });
}