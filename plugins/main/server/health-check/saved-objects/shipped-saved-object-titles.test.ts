import { readDashboardDefinitionFiles } from './dashboard-definition-reader';
import type {
  SavedObjectDashboard,
  SavedObjectVisualization,
} from './saved-object.types';

/**
 * The `title` of a shipped saved object is what the saved objects manager, the
 * "add panel" picker and any search over dashboard content display. An empty or
 * repeated title makes the object impossible to find, tell apart, export or
 * safely delete, so both properties are enforced over the whole shipped set.
 *
 * The panel header rendered inside a dashboard is a separate concern: it comes
 * from the panel's own `embeddableConfig.title` when there is one, which is what
 * lets a panel stay headerless while its saved object still has a name.
 */
describe('shipped saved objects', () => {
  const definitions = readDashboardDefinitionFiles();

  /* A few ids are shipped in more than one definition file. Provisioning walks
     the files in sorted order overwriting as it goes, so the surviving object is
     the one from the last file. */
  const visualizationsById = new Map<string, SavedObjectVisualization>();
  const dashboards: SavedObjectDashboard[] = [];

  for (const definition of definitions) {
    for (const visualization of definition.visualizations) {
      visualizationsById.set(visualization.id, visualization);
    }
    dashboards.push(definition.dashboard);
  }

  const visualizations = [...visualizationsById.values()];

  const findDuplicates = (titles: string[]) => {
    const seen = new Map<string, number>();
    for (const title of titles) {
      seen.set(title, (seen.get(title) ?? 0) + 1);
    }
    return [...seen.entries()]
      .filter(([, count]) => count > 1)
      .map(([title, count]) => `${title} (x${count})`);
  };

  it('ships at least one dashboard definition', () => {
    expect(definitions.length).toBeGreaterThan(0);
    expect(visualizations.length).toBeGreaterThan(0);
  });

  it.each([
    ['visualization', () => visualizations],
    ['dashboard', () => dashboards],
  ])('has a non-empty title on every %s', (_type, getObjects) => {
    const unnamed = getObjects()
      .filter(savedObject => !(savedObject.attributes.title || '').trim())
      .map(savedObject => savedObject.id);

    expect(unnamed).toEqual([]);
  });

  it.each([
    ['visualization', () => visualizations],
    ['dashboard', () => dashboards],
  ])('has a unique title on every %s', (_type, getObjects) => {
    const titles = getObjects().map(savedObject =>
      savedObject.attributes.title.trim(),
    );

    expect(findDuplicates(titles)).toEqual([]);
  });

  it('keeps every copy of a repeated id on the same title', () => {
    const titlesById = new Map<string, Set<string>>();

    for (const definition of definitions) {
      for (const visualization of definition.visualizations) {
        const titles = titlesById.get(visualization.id) ?? new Set<string>();
        titles.add(visualization.attributes.title);
        titlesById.set(visualization.id, titles);
      }
    }

    const divergent = [...titlesById.entries()]
      .filter(([, titles]) => titles.size > 1)
      .map(([id, titles]) => `${id}: ${[...titles].join(' / ')}`);

    expect(divergent).toEqual([]);
  });

  it('resolves every dashboard panel to a shipped visualization', () => {
    const unresolved: string[] = [];

    for (const dashboard of dashboards) {
      const idByRefName = Object.fromEntries(
        (dashboard.references || []).map(({ name, id }) => [name, id]),
      );
      const panels = JSON.parse(dashboard.attributes.panelsJSON);

      for (const panel of panels) {
        const id = idByRefName[panel.panelRefName];
        if (!id || !visualizationsById.has(id)) {
          unresolved.push(`${dashboard.id}/${panel.panelRefName}`);
        }
      }
    }

    expect(unresolved).toEqual([]);
  });
});
