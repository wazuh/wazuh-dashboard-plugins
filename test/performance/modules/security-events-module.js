const { WAIT_TIMEOUT, SERVER_URL } = require('../common/constants');
const logger = require('../common/logger');

module.exports = async function (context, commands) {
  // Navigate to a URL, but do not measure the URL
  await commands.navigate(SERVER_URL);
  

  try {
    
    await commands.wait.bySelector('button[data-test-subj="toggleNavButton"]', WAIT_TIMEOUT)
    await commands.click.bySelector('button[data-test-subj="toggleNavButton"]')
    await commands.wait.bySelector('a[href$="/app/wazuh"]', WAIT_TIMEOUT)
    await commands.click.bySelector('a[href$="/app/wazuh"]')
    //Wait for an Wazuh home page component to be loaded
    await commands.wait.byXpath('//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"Security events")]', WAIT_TIMEOUT)
    await commands.click.bySelector('[data-test-subj=menuWazuhButton]')
    // Click on Security Events module button
    await commands.wait.bySelector('[data-test-subj="overviewWelcomeGeneral"]', WAIT_TIMEOUT)
    await commands.click.bySelector('[data-test-subj="overviewWelcomeGeneral"]')
    // Start collecting metrics
    logger('--- Initiate measures in dashboard module ---');
    await commands.measure.start('security-events-module')
        logger('Alerts Evolutionn Top 5 Agent');
    await commands.wait.bySelector('[data-render-complete="true"][data-title="Alerts evolution Top 5 agents"]', WAIT_TIMEOUT)
    // Stop and collect the metrics
    logger('--- Finish measures ---', 'info');
    return commands.measure.stop();
  } catch (e) {
    // We try/catch so we will catch if the the input fields can't be found
    // The error is automatically logged in Browsertime an rethrown here
    // We could have an alternative flow ...
    // else we can just let it cascade since it caught later on and reported in
    // the HTML
    throw e;
  }
};
