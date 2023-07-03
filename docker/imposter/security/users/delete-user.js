var id = context.request.queryParams.user_ids;
var storeWazuh = stores.open('storeWazuh');

storeWazuh.save('deleteUser', true);

var data = {
  data: {
    affected_items: [
      {
        id: id,
        username: 'test',
        allow_run_as: false,
        roles: [],
      },
    ],
    total_affected_items: 1,
    total_failed_items: 0,
    failed_items: [],
  },
  message: 'Users were successfully deleted',
  error: 0,
};

respond().withStatusCode(200).withData(JSON.stringify(data));
