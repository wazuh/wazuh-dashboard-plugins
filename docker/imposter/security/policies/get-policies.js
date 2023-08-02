var storeWazuh = stores.open('storeWazuh');
var deletePolicies = storeWazuh.load('deletePolicies');

switch (deletePolicies) {
  case false:
    respond()
      .withStatusCode(200)
      .withFile('security/policies/get-policies.json');
    break;
  case true:
    storeWazuh.save('deletePolicies', false);
    respond()
      .withStatusCode(200)
      .withFile('security/policies/get-policies-after-delete.json');
    break;
  default:
    respond()
      .withStatusCode(200)
      .withFile('security/policies/get-policies.json');
    break;
}
