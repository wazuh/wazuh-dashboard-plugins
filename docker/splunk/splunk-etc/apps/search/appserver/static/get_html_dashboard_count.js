require(['splunk.util'], function(splunkUtil) {
    var interval = setInterval(function() {
        try {
            var numHTMLDashboards = document.querySelectorAll('#num_html #singlevalue')[0].textContent.trim();
            var count = parseInt(numHTMLDashboards);
            if (count) {
                splunkUtil.trackEvent({
                    type: "html_dashboard",
                    data: {
                        count: count,
                    },
                });
            }
            clearInterval(interval);
        } catch(e) {
            // element not found
        }
    }, 1000);
});
