import { When } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible} from '../../utils/driver';

When('The user is in the overview page', () => {
  elementIsVisible('react-component[name="OverviewWelcome"]');
  elementIsVisible('react-component[name="StatsOverview"]');
});