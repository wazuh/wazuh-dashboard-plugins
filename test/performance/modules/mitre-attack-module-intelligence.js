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
    // Start collecting metrics
    await commands.measure.start('Mitre - Intelligence');
    logger('--- Initiate measures in Intelligence - Dashboard module ---');
    await commands.wait.byCondition("!isNaN(parseInt(document.querySelector('.statWithLink').innerHTML))", WAIT_TIMEOUT)
    //Waiting for full load of the page
    await commands.click.byXpath('//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"MITRE")]')

    // Accesing to Intelligence Dashboard
    await commands.wait.byXpath('//*[contains(@class,"euiTab")]//*[contains(text(),"Intelligence")]', WAIT_TIMEOUT)
    await commands.click.byXpath('//*[contains(@class,"euiTab")]//*[contains(text(),"Intelligence")]')
    logger('Groups Table');
    await commands.wait.bySelector('.euiBasicTable:not(.euiBasicTable-loading)', WAIT_TIMEOUT)
    logger('Mitigations');
    await commands.wait.byXpath('//*[contains(@class,"euiFlexItem euiFlexItem--flexGrowZero")]//*[contains(text(),"Mitigations")]', WAIT_TIMEOUT)
    //Clicking on Mitigations
    await commands.click.byXpath('//*[contains(@class,"euiFlexItem euiFlexItem--flexGrowZero")]//*[contains(text(),"Mitigations")]', WAIT_TIMEOUT)
    //Searching mitigations table
    logger('Mitigations Table');
    await commands.wait.bySelector('.euiBasicTable:not(.euiBasicTable-loading)', WAIT_TIMEOUT)
    //Clicking on Software
    await commands.wait.byXpath('//*[contains(@class,"euiFlexItem euiFlexItem--flexGrowZero")]//*[contains(text(),"Software")]', WAIT_TIMEOUT)
    await commands.click.byXpath('//*[contains(@class,"euiFlexItem euiFlexItem--flexGrowZero")]//*[contains(text(),"Software")]', WAIT_TIMEOUT)
    //Searching software table
    await commands.wait.bySelector('.euiBasicTable:not(.euiBasicTable-loading)', WAIT_TIMEOUT)
    logger('Software Table');
    //Clicking on Tactics
    await commands.wait.byXpath('//*[contains(@class,"euiFlexItem euiFlexItem--flexGrowZero")]//*[contains(text(),"Tactics")]', WAIT_TIMEOUT)
    await commands.click.byXpath('//*[contains(@class,"euiFlexItem euiFlexItem--flexGrowZero")]//*[contains(text(),"Tactics")]', WAIT_TIMEOUT)
    //Searching tactics table
    logger('Tactics Table');
    await commands.wait.bySelector('.euiBasicTable:not(.euiBasicTable-loading)', WAIT_TIMEOUT)
    //Clicking on Techniques
    await commands.wait.byXpath('//*[contains(@class,"euiFlexItem euiFlexItem--flexGrowZero")]//*[contains(text(),"Techniques")]', WAIT_TIMEOUT)
    await commands.click.byXpath('//*[contains(@class,"euiFlexItem euiFlexItem--flexGrowZero")]//*[contains(text(),"Techniques")]', WAIT_TIMEOUT)
    //Searching techniques table
    logger('Techniques Table');
    await commands.wait.bySelector('.euiBasicTable:not(.euiBasicTable-loading)', WAIT_TIMEOUT)
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
