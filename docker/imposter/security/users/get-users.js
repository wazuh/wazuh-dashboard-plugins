var storeWazuh = stores.open('storeWazuh');
var deleteUser = storeWazuh.load('deleteUser');

switch (deleteUser) {
  case false:
    respond().withStatusCode(200).withFile('security/users/get-users.json');
    break;
  case true:
    storeWazuh.save('deleteUser', false);
    respond()
      .withStatusCode(200)
      .withFile('security/users/get-users-after-delete.json');
    break;
  default:
    respond().withStatusCode(200).withFile('security/users/get-users.json');
    break;
}
