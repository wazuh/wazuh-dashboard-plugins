define([
  'jquery',
  'underscore',
  'splunkjs/mvc/searchmanager',
  'splunkjs/mvc/simplexml/ready!'
  ], function(
    $,
    _,
    SearchManager) {

    $('.fieldset').hide();
    $('.dashboard-row').hide();

    var NO_TOKENS_MSG = _("You currently have no tokens configured.").t();
    var ERROR_MSG = _("We were unable to retrieve any tokens. Please make sure your HTTP Event Collector is enabled and you have tokens configured").t();
    var tokenSearchQuery = "| rest splunk_server_group=* /services/data/inputs/http | eval token_name=substr('title', 8)";

    var tokenSearchManager = new SearchManager({
      search: tokenSearchQuery,
      autostart: true,
      auto_cancel: 90,
      cache: false,
      preview: true
    });

    tokenSearchManager.on('search:done', function(properties) {
      var count = properties.content.resultCount;
      if(count === 0) {
        $('#no_token_message_view').html('<p>' + NO_TOKENS_MSG + '</p>').show();
      } else {
        $('.dashboard-row').show();
        $('.fieldset').show();
        $('#no_token_message_view').hide();
      }
    }).on('search:failed search:error search:cancelled', function() {
      $('#no_token_message_view').html('<p>' + ERROR_MSG + '</p>').show();
    });
  }
);
