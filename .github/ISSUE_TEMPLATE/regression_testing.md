---
name: Release Candidate - UI regression testing
about: Report the results after running UI manual tests.
title: 'Release [WAZUH VERSION] - Release Candidate [RC VERSION] - Wazuh UI regression testing'
labels: 'level/task, type/test'
assignees: ''

---

The following issue aims to run manual tests for the current release candidate, report the results, and open new issues for any encountered errors.

## Wazuh UI tests information
|                                        |     |
|----------------------------------------|-----|
| **Main release candidate issue**       |     |
| **Version**                            |     |
| **Release candidate #**                |     |
| **Tag**                                |     |
| **Previous UI regression tests issue** |     |

## Test report procedure

**TL;DR**
   1. The specified tests will be executed in every platform and version mentioned in this issue.
   1. Include evidence of each test performed.
   1. Report any problem or bug. Open a new issue for each of them and link them here.
   1. Justify skipped tests.


All test results must have one the following statuses: 
|                 |                                                                      |
|-----------------|----------------------------------------------------------------------|
| :black_circle:  | The test hasn't started yet.                                         |
| :green_circle:  | All checks passed.                                                   |
| :red_circle:    | There is at least one failed check.                                  |
| :yellow_circle: | There is at least one expected fail or skipped test and no failures. |


Any failing test must be properly addressed with a new issue, detailing the error and the possible cause.
It must be included in the `Problems` section of the current release candidate issue.

Any expected fail or skipped test must be justified with a reason. 
All auditors must validate the justification for an expected fail or skipped test.

An extended report of the test results must be attached as a zip, txt or images. 
This report can be used by the auditors to dig deeper into any possible failures and details.

## Test template

| Test | Chrome         | Firefox        | Safari         |
|------|----------------|----------------|----------------|
| -    | :black_circle: | :black_circle: | :black_circle: |


## Test plan

1. Verify the app package installs and operates as expected.
2. [ISSUES]


## Conclusions

| Status         | Platform                       |
|----------------|--------------------------------|
| :black_circle: | Wazuh dashboards [VERSION][RC] |
| :black_circle: | Kibana 7.17.9                  |
| :black_circle: | Kibana 7.16.3                  |
| :black_circle: | Kibana 7.10.2 + ODFE 1.2.0     |

<!-- ** Copy and paste as a new comment. Modify as needed. **

## Conclusions

All tests have been executed and the results can be above.


All tests have passed and the fails have been reported or justified. I therefore conclude that this issue is finished and OK for this release candidate.
-->

## Auditors validation
The definition of done for this one is the validation of the conclusions and the test results from all auditors.

All checks from below must be accepted in order to close this issue.

- [ ] 
