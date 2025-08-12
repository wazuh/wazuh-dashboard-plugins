import NavigationService from '../../../../react-services/navigation-service';
import { dashboardAssistant } from '../../../../utils/applications';

export class DashboardAssistantNavigationService {
  static redirectTo(path: string) {
    NavigationService.getInstance().getUrlForApp(dashboardAssistant.id, {
      path: `#${dashboardAssistant.redirectTo()}/${path}`,
    });
  }

  static Home() {
    NavigationService.getInstance().navigate(`${dashboardAssistant.id}`);
  }

  static RegisterModel() {
    this.redirectTo('register-model');
  }
}
