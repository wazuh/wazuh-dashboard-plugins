let ready;

const documentTitle = $('title');
/**
 * Set Wazuh Favicon
 */
document.querySelectorAll('head link[rel="icon"], head link[rel="shortcut icon"]').
  forEach((fav) => { fav.setAttribute('href', '/plugins/wazuh/assets/icon_blue.svg') });

documentTitle.text(documentTitle.text().replace('Wazuh - Elastic', 'Wazuh Cloud'));
documentTitle.text(documentTitle.text().replace('Elastic', 'Wazuh Cloud'));

const observerMainApp = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (!mutation.addedNodes || !mutation.addedNodes.length) return;
    /**
     * Fix Help Menu
     */
    if (mutation.addedNodes[0].innerHTML &&
      mutation.addedNodes[0].innerHTML.indexOf('Kibana documentation') != -1 &&
      mutation.addedNodes[0].innerHTML.indexOf('Ask Elastic') != -1) {
      const $node = $(mutation.addedNodes[0]);
      const elementsToHide = ['a[href^="https://www.elastic.co/products/kibana/ask-elastic"]',
        'a[href="https://github.com/elastic/kibana/issues/new/choose"]',
        'div.euiSpacer.euiSpacer--xs'
      ];
      $node.find(elementsToHide.join(',')).addClass('hide');
      $spanDocumentation = $node.find('span.euiButtonEmpty__text:contains(Kibana documentation)');
      $spanDocumentation.text('Wazuh documentation');
      $spanDocumentation.closest('a')
        .attr('href', 'https://documentation.wazuh.com')
        .removeClass('hide')
        .next()
        .removeClass('hide');
      $node.find('a[href^="https://www.elastic.co/products/kibana/feedback"]')
        .attr('href', 'https://survey.sogosurvey.com/r/x61AlE')
        .removeClass('hide');
    }
    /**
     * Fix left-menu overview link
     */
    else if (mutation.target.nodeName == 'HEADER' &&
      mutation.target.getAttribute('data-test-subj') === 'headerGlobalNav' &&
      mutation.target.className == 'hide-for-sharing headerGlobalNav') {
      $(mutation.target).find('a[href$="app/kibana_overview"]').parent().addClass('hide');
    }
    /**
     * Fix top-left Logo home link
     */
    const homeLink = document.querySelector('#globalHeaderBars a.euiHeaderLogo[href$="/app/home"]');
    if (homeLink) {
      changeHomeLink(homeLink);
    }
  })
});

let observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (!mutation.addedNodes || !mutation.addedNodes.length) return;

    var loginWrapper = $('.login-wrapper');
    try {
      if (loginWrapper.length && !ready) {
        ready = true;
        $('.content').addClass('wz-login');
        var logo = $('figure > img', loginWrapper);
        logo.attr('src', '/plugins/wazuh/assets/wazuh_logo_login.svg');
        var title = $('.euiText.euiText--medium > .euiTextAlign', loginWrapper);
        title.text('Wazuh Cloud');
        var subtitle = $('.euiText.euiText--small > .euiTextAlign', loginWrapper);
        subtitle.text('The Open Source Security Platform');
      }
    } catch (error) {
      console.log(error);
    }
  });
});

(function () {
  // stop watching using:
  observer.disconnect();
  observerMainApp.disconnect();

  if (document.location.pathname.indexOf('login') != -1) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  } else {
    observerMainApp.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  }
})();

/**
 * Changes the kibana home url to wazuh home url
 * 
 * */
function changeHomeLink(eLink) {

  const parent = eLink.parentNode;
  const wrapper = document.createElement('a');
  eLink.setAttribute('href', '/app/wazuh');
  wrapper.setAttribute('href', '/app/wazuh');
  wrapper.addEventListener('click', function (ev) {
    ev.stopPropagation();
    ev.preventDefault();
    window.location.href = '/app/wazuh';
    return
  }, true);
  parent.replaceChild(wrapper, eLink);
  wrapper.appendChild(eLink);


}