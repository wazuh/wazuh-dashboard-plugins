var app = require('ui/modules').get('app/wazuh', []);

app.directive('whenScrolled', function() {
  return function(scope, elm, attr) {
    var raw = elm[0];   

    elm.bind('scroll', function() {
      if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight -150 ) {
        scope.$apply(attr.whenScrolled);
      }
    });
  };
});
