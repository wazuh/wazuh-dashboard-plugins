const { WAIT_TIMEOUT, SERVER_URL } = require('../common/constants');
const logger = require('../common/logger');

module.exports = async function (context, commands) {
  // Navigate to a URL, but do not measure the URL
  await commands.navigate(SERVER_URL);

  try {
    // Start collecting metrics
    
    // Click on Kibana menu to access Wazuh App link
    await commands.wait.bySelector('button[data-test-subj="toggleNavButton"]', WAIT_TIMEOUT)
    await commands.click.bySelector('button[data-test-subj="toggleNavButton"]')
    await commands.wait.bySelector('a[href$="/app/wazuh"]', WAIT_TIMEOUT)
    await commands.click.bySelector('a[href$="/app/wazuh"]')
    
    //Wait for an Wazuh home page component to be loaded
    await commands.wait.byXpath('//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"Security events")]', WAIT_TIMEOUT)
    
    // Click on the Wazuh menu button
    await commands.click.bySelector('[data-test-subj=menuWazuhButton]')
    
    // Click on Agents module button
    await commands.wait.bySelector('[data-test-subj=menuAgentsButton]', WAIT_TIMEOUT)
    await commands.click.bySelector('[data-test-subj=menuAgentsButton]')
    
    await commands.measure.start('agent-dashboard')
    logger('--- Initiate measures in dashboard module ---');

    logger('--- EVOLUTION CHART ---');
    await commands.wait.bySelector('#Wazuh-App-Overview-General-Agents-status .visWrapper__column .x-axis-title text', WAIT_TIMEOUT)
    
    logger('--- MOST ACTIVE AGENT ---');
    await commands.wait.bySelector('div.agents-details-card .agents-link-item:nth-child(2) .last-agents-link a', WAIT_TIMEOUT)

    logger('--- AGENT TABLE FIRST ROW ---');
    await commands.wait.bySelector('tbody tr[data-test-subj^="row"]', WAIT_TIMEOUT)

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
