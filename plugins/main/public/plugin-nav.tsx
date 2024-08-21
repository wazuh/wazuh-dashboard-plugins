import { CoreSetup } from '../../../src/core/public';
import { AppPluginStartDependencies } from './types';
import { Applications, CategoriesNavGroup } from './utils/applications';

export function PluginNav(core: CoreSetup<AppPluginStartDependencies>) {
  Applications.forEach(app => {
    const [category] = CategoriesNavGroup.filter(
      category => category.id === app.category,
    );
    core.chrome.navGroup.addNavLinksToGroup(category, [
      {
        id: app.id,
        category: app.category,
        order: app.order,
        showInAllNavGroup: true,
      },
    ]);
  });
}
