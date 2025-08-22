var storeWazuh = stores.open('storeWazuh');
var subscriptionStatus = storeWazuh.load('subscription');

switch (subscriptionStatus) {
  case 'active':
    storeWazuh.save('subscription', 'inactive');
    respond().withStatusCode(200).withFile('manager/info/info-active.json');
    break;
  case 'inactive':
    storeWazuh.save('subscription', 'processing');
    respond().withStatusCode(200).withFile('manager/info/info-inactive.json');
    break;
  case 'processing':
    storeWazuh.save('subscription', 'active');
    respond().withStatusCode(200).withFile('manager/info/info-processing.json');
    break;
}
