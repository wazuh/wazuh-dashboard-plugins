import { AppState } from '../../react-services';
import NavigationService from '../../react-services/navigation-service';

export function enableMenu() {
  if (
    !NavigationService.getInstance().getPathname().includes('/health-check')
  ) {
    AppState.setWzMenu();
  }
}
