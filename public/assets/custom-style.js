let ready;
let observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (!mutation.addedNodes) return;

    var loginWrapper = $('.login-wrapper');
    try {
      if (loginWrapper.length && !ready) {
        ready = true;
        $('.content').addClass('wz-login');
        var logo = $('figure > img', loginWrapper);
        logo.attr('src', '/plugins/wazuh/assets/wazuh_logo_circle.svg');
        var title = $('.euiText.euiText--medium > .euiTextAlign', loginWrapper);
        title.text('Welcome to Wazuh');
        var subtitle = $('.euiText.euiText--small > .euiTextAlign', loginWrapper);
        subtitle.text('The Open Source Security Platform');        
      }
    } catch (error) {
      console.log(error);
    }
  });
});

$(function () {
  if (document.location.pathname.indexOf('login')) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  } else {
    // stop watching using:
    observer.disconnect();
  }
});
