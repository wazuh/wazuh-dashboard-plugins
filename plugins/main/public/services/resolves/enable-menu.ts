import { AppState } from '../../react-services';

export function enableMenu({ location }) {
  if (!location.pathname.includes('/health-check')) {
    AppState.setWzMenu();
  }
}
