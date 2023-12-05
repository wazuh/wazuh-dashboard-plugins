var id = context.request.queryParams.role_ids;
var storeWazuh = stores.open('storeWazuh');

storeWazuh.save('deleteRole', true);

var data = {
  data: {
    affected_items: [
      {
        id: id,
        name: 'administrator',
        policies: [4, 5],
        rules: [8],
        users: [101, 104],
      },
    ],
    total_affected_items: 1,
    total_failed_items: 0,
    failed_items: [],
  },
  message: 'All specified roles were deleted',
  error: 0,
};

respond().withStatusCode(200).withData(JSON.stringify(data));
