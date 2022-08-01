const { WAIT_TIMEOUT, SERVER_URL } = require('../common/constants');
const logger = require('../common/logger');

module.exports = async function (context, commands) {
  // Navigate to a URL, but do not measure the URL
  await commands.navigate(SERVER_URL);

  try {
    // Click on Kibana menu to access Wazuh App link
    await commands.wait.bySelector('button[data-test-subj="toggleNavButton"]', WAIT_TIMEOUT)
    await commands.click.bySelector('button[data-test-subj="toggleNavButton"]')
    await commands.wait.bySelector('a[href$="/app/wazuh"]', WAIT_TIMEOUT)
    await commands.click.bySelector('a[href$="/app/wazuh"]')
    
    //Wait for an Wazuh home page component to be loaded
    await commands.wait.byXpath('//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"Security events")]', WAIT_TIMEOUT)

    // Click on MITRE module button
    await commands.wait.byXpath('//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"MITRE")]', WAIT_TIMEOUT)
    //Waiting for full load of the page
    await commands.wait.byCondition("!isNaN(parseInt(document.querySelector('.statWithLink').innerHTML))", WAIT_TIMEOUT)
    await commands.click.byXpath('//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"MITRE")]')
    logger('END MITRE BUTTON');
    
    // Accesing to Framework Dashboard
    await commands.wait.byXpath('//*[contains(@class,"euiTab")]//*[contains(text(),"Framework")]', WAIT_TIMEOUT)
    await commands.click.byXpath('//*[contains(@class,"euiTab")]//*[contains(text(),"Framework")]')

    // Start collecting metrics
    await commands.measure.start('MITRE ATT&CK module -Intelligence Dashboard')
    logger('--- Initiate measures in Intelligence - Sashboard module ---');
    // Search Techniques Table
    logger('Techniques Table');
    await commands.wait.bySelector('[class="euiFlexGrid euiFlexGrid--gutterSmall euiFlexGrid--fourths euiFlexGrid--responsive"]', WAIT_TIMEOUT)

    logger('--- Finish measures ---', 'info');
    
    // Stop and collect the metrics
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
