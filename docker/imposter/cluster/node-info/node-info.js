var storeWazuh = stores.open('storeWazuh');
var subscriptionStatus = storeWazuh.load('subscription');
var attempt = storeWazuh.load('attempt');

switch (subscriptionStatus) {
  case 'error':
    storeWazuh.save('subscription', 'inactive');
    storeWazuh.save('attempt', 0);
    respond().withStatusCode(400).skipDefaultBehaviour();
    break;
  case 'inactive':
    storeWazuh.save('subscription', 'pending');
    storeWazuh.save('attempt', attempt + 1);
    respond()
      .withStatusCode(200)
      .withFile('cluster/node-info/node-info-inactive.json');
    break;
  case 'pending':
    if (attempt === 5) {
      storeWazuh.save('subscription', 'active');
    } else {
      storeWazuh.save('subscription', 'pending');
      storeWazuh.save('attempt', attempt + 1);
    }
    respond()
      .withStatusCode(200)
      .withFile('cluster/node-info/node-info-pending.json');
    break;
  case 'active':
    if (attempt === 5) {
      storeWazuh.save('subscription', 'error');
    }
    respond()
      .withStatusCode(200)
      .withFile('cluster/node-info/node-info-active.json');
    break;
}
