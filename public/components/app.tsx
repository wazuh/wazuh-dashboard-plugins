import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import { CoreStart } from 'kibana/public';
import { NavigationPublicPluginStart } from '../../../../src/plugins/navigation/public';

interface TestPluginAppDeps {
  basename: string;
  notifications: CoreStart['notifications'];
  http: CoreStart['http'];
  navigation: NavigationPublicPluginStart;
}
