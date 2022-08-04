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
    await commands.wait.byXpath('//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"NIST 800-53")]', WAIT_TIMEOUT)
    await commands.wait.byCondition("!isNaN(parseInt(document.querySelector('.statWithLink').innerHTML))", WAIT_TIMEOUT)
    
    // Start collecting metrics
    await commands.measure.start('NIST 800-53 module - Dashboard')
    logger('--- Initiate measures in Intelligence - Dashboard module ---');
    await commands.click.byXpath('//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"NIST 800-53")]')
    
    logger('--- Most active agents ---')
    await commands.wait.bySelector('#moduleDashboard .euiFlexItem.h-100 #Wazuh-App-Overview-NIST-Agents .visLib.visLib--legend-right', WAIT_TIMEOUT)

    logger('--- Top requirements over time ---')
    await commands.wait.bySelector('#moduleDashboard .euiFlexItem.h-100 #Wazuh-App-Overview-NIST-Requirements-over-time .visLib.visLib--legend-right', WAIT_TIMEOUT)
    
    logger('--- Requirements distribution by agents ---')
    await commands.wait.bySelector('#moduleDashboard .euiFlexItem.h-100 #Wazuh-App-Overview-NIST-requirements-by-agents .visLib.visLib--legend-right', WAIT_TIMEOUT)
    
    logger('--- Alerts volume by agent ---')
    await commands.wait.bySelector('#moduleDashboard .euiFlexItem.h-100 #Wazuh-App-Overview-NIST-Requirements-Agents-heatmap .visLib.visLib--legend-right', WAIT_TIMEOUT)

    logger('--- Stats ---')
    await commands.wait.bySelector('#moduleDashboard .euiFlexItem.h-100 #Wazuh-App-Overview-NIST-Metrics .mtrVis__container', WAIT_TIMEOUT)

    logger('--- Top 10 requirements ---')
    await commands.wait.bySelector('#moduleDashboard .euiFlexItem.h-100 #Wazuh-App-Overview-NIST-Top-10-requirements .visLib.visLib--legend-right', WAIT_TIMEOUT)

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