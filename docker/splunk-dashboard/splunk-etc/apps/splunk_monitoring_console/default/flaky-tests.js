/**
 * What does "flaky" mean?
 * 1) non-deterministic failures
 * 2) leaks into global scope causing unrelated failures in other tests
 *
 * These exclusions were created as part of https://jira.splunk.com/browse/SPL-181615.
 *
 * Expectations for adding new failures into this file:
 *
 * 1) A followup JIRA must be created and referenced to fix the excluded test.
 * 2) The excluded test was failing prior to your PR. If it started failing on your PR you should fix it now.
 */

module.exports = {
    splunk_monitoring_console: [
        // https://jira.splunk.com/browse/SPL-203700
        'views/instances/test_instancespage.js',
    ],
}
