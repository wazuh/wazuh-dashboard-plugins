var id = context.request.queryParams.rule_ids;
var storeWazuh = stores.open('storeWazuh');

storeWazuh.save('deleteRolesMapping', true);

var data = {
  data: {
    affected_items: [
      {
        id: id,
        name: 'TestWazuhRule',
        rule: {
          MATCH: {
            definition: 'test_rule',
          },
        },
        roles: [],
      },
    ],
    total_affected_items: 1,
    total_failed_items: 0,
    failed_items: [],
  },
  message: 'All specified security rules were deleted',
  error: 0,
};

respond().withStatusCode(200).withData(JSON.stringify(data));
