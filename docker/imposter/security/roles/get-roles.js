var storeWazuh = stores.open('storeWazuh');
var deleteRole = storeWazuh.load('deleteRole');

switch (deleteRole) {
  case false:
    respond().withStatusCode(200).withFile('security/roles/get-roles.json');
    break;
  case true:
    storeWazuh.save('deleteRole', false);
    respond()
      .withStatusCode(200)
      .withFile('security/roles/get-roles-after-delete.json');
    break;
  default:
    respond().withStatusCode(200).withFile('security/roles/get-roles.json');
    break;
}
