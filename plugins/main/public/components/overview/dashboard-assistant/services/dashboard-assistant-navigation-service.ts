import NavigationService from '../../../../react-services/navigation-service';
import { SECTIONS } from '../../../../sections';
import { dashboardAssistant } from '../../../../utils/applications';

export class DashboardAssistantNavigationService {
  static getRedirectUrl(path: string) {
    return NavigationService.getInstance().getUrlForApp(dashboardAssistant.id, {
      path: `#${dashboardAssistant.redirectTo()}/${path}`,
    });
  }

  static Home() {
    NavigationService.getInstance().navigate(`${dashboardAssistant.id}`);
  }

  static RegisterModel() {
    return DashboardAssistantNavigationService.getRedirectUrl(
      SECTIONS.REGISTER_MODEL,
    );
  }
}
