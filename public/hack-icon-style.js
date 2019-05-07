import chrome from 'ui/chrome';
const IS_DARK_THEME = chrome.getUiSettingsClient().get('theme:darkMode');

if (IS_DARK_THEME) {
  var newSS = document.createElement('link');
  newSS.rel = 'stylesheet';
  newSS.href = '../plugins/wazuh/less/icon-style-w.css';
  document.getElementsByTagName('head')[0].appendChild(newSS);
} else {
  var newSS = document.createElement('link');
  newSS.rel = 'stylesheet';
  newSS.href = '../plugins/wazuh/less/icon-style.css';
  document.getElementsByTagName('head')[0].appendChild(newSS);
}
