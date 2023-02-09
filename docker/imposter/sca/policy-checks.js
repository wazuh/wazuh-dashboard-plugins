var status =
  context.request.queryParams.status || context.request.queryParams.result;

console.log(status);

switch (status) {
  case 'failed':
    respond().withStatusCode(200).withFile('sca/policy_checks_failed.json');
    break;
  case 'not applicable':
    respond()
      .withStatusCode(200)
      .withFile('sca/policy_checks_not_applicable.json');
    break;
  case 'passed':
    respond().withStatusCode(200).withFile('sca/policy_checks_passed.json');
    break;
  case '':
    respond().withStatusCode(200).withFile('sca/policy_checks.json');
    break;
  default:
    respond().withStatusCode(200).withFile('sca/policy_checks.json');
    break;
}
