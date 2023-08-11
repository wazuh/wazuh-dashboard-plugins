var id = context.request.queryParams.policy_ids;
var storeWazuh = stores.open('storeWazuh');

storeWazuh.save('deletePolicies', true);

var data = {
  data: {
    affected_items: [
      {
        id: id,
        name: 'TestWazuhPolicy',
        policy: {
          actions: ['security:delete'],
          resources: ['user:id:*'],
          effect: 'deny',
        },
        roles: [],
      },
    ],
    total_affected_items: 1,
    total_failed_items: 0,
    failed_items: [],
  },
  message: 'All specified policies were deleted',
  error: 0,
};

respond().withStatusCode(200).withData(JSON.stringify(data));
