import { getThemeAssetURL, getAssetURL } from '../utils/assets';
import { initializeInterceptor, unregisterInterceptor } from '../services/request-handler';


export default class AppsRegister {
  constructor(core) {
    this._core = core;
    this._UI_THEME = core.uiSettings.get('theme:darkMode') ? 'dark' : 'light';

  }

  private _SIDEBAR_LOGO = 'customization.logo.sidebar';
  private _UI_THEME = 'light';
  private _core = null;
  private _isWazuhDisabled = 0;
  private _logosInitialState = {};


  async setIsWazuhDisabled() {

    //Check if user has wazuh disabled and avoid registering the application if not
    try {
      const { isWazuhDisabled } = await this._core.http.get('/api/check-wazuh');
      this._isWazuhDisabled = isWazuhDisabled || 0;
    }
    catch (error) {
      console.error('plugin.ts: Error checking if Wazuh is enabled', error);
      this._isWazuhDisabled = 1;
    }
  }

  async initLogos() {
    try {
      this._logosInitialState = await this._core.http.get(`/api/logos`);
    }
    catch (error) {
      console.error('plugin.ts: Error getting logos configuration', error);
    }
  }

  getMainLogo(): string {
    return this._core.http.basePath.prepend(this._logosInitialState?.logos?.[this._SIDEBAR_LOGO] ? getAssetURL(this._logosInitialState?.logos?.[this._SIDEBAR_LOGO]) : getThemeAssetURL('icon.svg', this._UI_THEME))
  }


  registerApps({apps, hideTelemetryBanner}) {
    if (!this._isWazuhDisabled) {
      apps.forEach((app, key) => {
        // New module app registration
        this._core.application.register({
          ...app,
          icon: this.getMainLogo(),
          mount: async (params) => {

            // hide the telemetry banner.
            // Set the flag in the telemetry saved object as the notice was seen and dismissed
            hideTelemetryBanner && await hideTelemetryBanner();

            //Intercept request and validate session
            initializeInterceptor(this._core);

            //Mount the app
            const unmount = await app.mount({ core: this._core, params });
            return () => {
              unregisterInterceptor();
              unmount();
            };
          },
          category: {
            id: 'wazuh',
            label: 'Wazuh',
            order: key,
            euiIconType: this.getMainLogo(),
          },
        });
      });
    }
  }
}
