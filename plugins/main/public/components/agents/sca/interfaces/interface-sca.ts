import { IndexPattern } from "src/plugins/data/common";

interface TabButton {
  compare: null;
  displayName: string;
}

interface TabComponent {
  compare: null;
  displayName: string;
}

interface Tab {
  id: string;
  name: string;
  buttons: TabButton[];
  component?: TabComponent;
}

interface Module {
  init: string;
  tabs: Tab[];
  buttons: string[];
  availableFor: string[];
}

interface AgentsSelectionProps {
  tab: string;
  subtab: string;
}

export interface SCAInventoryProps {
  section: string;
  tabView: string;
  agentsSelectionProps: AgentsSelectionProps;
  tabs: Tab[];
  module: Module;
  moduleID: string;
  agent: Record<string, any>;
  indexPatternID: string;
  indexPattern: IndexPattern;
}
