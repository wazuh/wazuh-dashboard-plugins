var storeWazuh = stores.open('storeWazuh');
var subscriptionStatus = storeWazuh.load('subscription');
var attempt = storeWazuh.load('attempt');

switch (subscriptionStatus) {
  case 'error':
    storeWazuh.save('subscription', 'pending');
    storeWazuh.save('attempt', 0);
    respond().withStatusCode(400).skipDefaultBehaviour();
    break;
  case 'pending':
    storeWazuh.save('subscription', 'polling');
    storeWazuh.save('attempt', attempt + 1);
    respond()
      .withStatusCode(200)
      .withFile('cluster/node-info/node-info-pending.json');
    break;
  case 'polling':
    if (attempt === 5) {
      storeWazuh.save('subscription', 'available');
    } else {
      storeWazuh.save('attempt', attempt + 1);
    }
    respond()
      .withStatusCode(200)
      .withFile('cluster/node-info/node-info-polling.json');
    break;
  case 'available':
    storeWazuh.save('subscription', 'denied');
    respond()
      .withStatusCode(200)
      .withFile('cluster/node-info/node-info-available.json');
    break;
  case 'denied':
    storeWazuh.save('subscription', 'error');
    respond()
      .withStatusCode(200)
      .withFile('cluster/node-info/node-info-denied.json');
    break;
}
