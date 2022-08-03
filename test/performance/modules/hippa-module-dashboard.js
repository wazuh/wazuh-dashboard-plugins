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
    // Click on Policy Monitoring module button
    await commands.wait.byXpath('//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"HIPAA")]', WAIT_TIMEOUT)
    //Waiting for full load of the page
    await commands.wait.byCondition("!isNaN(parseInt(document.querySelector('.statWithLink').innerHTML))", WAIT_TIMEOUT)
    // Start collecting metrics
    logger('--- Initiate measures in dashboard Module Dashboard');
    await commands.measure.start('HIPAA -module')
    await commands.click.byXpath('//*[contains(@class,"euiTitle euiTitle--small euiCard__title")]//*[contains(text(),"HIPAA")]')
    logger('Alerts volume by agent');
    await commands.wait.bySelector('[data-render-complete="true"][data-title="Alerts volume by agent"]', WAIT_TIMEOUT)    
    logger('Most common alerts');
    await commands.wait.bySelector('[data-render-complete="true"][data-title="Most common alerts"]', WAIT_TIMEOUT)    
    logger('Top 10 requirements');
    await commands.wait.bySelector('[data-render-complete="true"][data-title="Top 10 requirements"]', WAIT_TIMEOUT)
    logger('Most active agents');
    await commands.wait.bySelector('[data-render-complete="true"][data-title="Most active agents"]', WAIT_TIMEOUT)
    logger('Stats');
    await commands.wait.bySelector('[data-render-complete="true"][data-title="Stats"]', WAIT_TIMEOUT)
    logger('Requirements evolution over time');
    await commands.wait.bySelector('[data-render-complete="true"][data-title="Requirements evolution over time"]', WAIT_TIMEOUT)
    logger('Requirements distribution by agent');
    await commands.wait.bySelector('[data-render-complete="true"][data-title="Requirements distribution by agent"]', WAIT_TIMEOUT)
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
