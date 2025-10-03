import { existsSync, unlinkSync } from 'fs';
import { GenerateOverrideOptions, EnvironmentPaths } from '../types/config';
import { DASHBOARD_ENTRYPOINT_PATH, DASHBOARD_SRC_PROFILE, OVERRIDE_COMPOSE_FILE } from '../constants/app';
import { writeFile } from '../utils/io';
import { toRepositoryEnvVar } from '../utils/envUtils';
import { ComposeOverrideError } from '../errors';

export function generateOverrideFile(
  options: GenerateOverrideOptions,
  _envPaths: EnvironmentPaths
): string | null {
  const { externalRepositories, repositoryEnvMap, useDashboardFromSource, includeSecurityPlugin } = options;
  const shouldGenerate = useDashboardFromSource || externalRepositories.length > 0;

  if (!shouldGenerate) {
    if (existsSync(OVERRIDE_COMPOSE_FILE)) {
      unlinkSync(OVERRIDE_COMPOSE_FILE);
      // eslint-disable-next-line no-console
      console.log('[INFO] Removed previous compose override file.');
    } else {
      // eslint-disable-next-line no-console
      console.log('[INFO] No dynamic compose override required.');
    }
    return null;
  }

  const messages: string[] = [];
  if (useDashboardFromSource) messages.push('dashboard sources mode');
  if (externalRepositories.length > 0) messages.push(`external repositories: ${externalRepositories.join(', ')}`);
  // eslint-disable-next-line no-console
  console.log(`[INFO] Generating compose override for ${messages.join(' and ')}`);

  let content = 'services:\n';

  if (useDashboardFromSource) {
    content += '  dashboard-src-installer:\n';
    content += '    image: node:${NODE_VERSION}\n';
    content += '    profiles:\n';
    content += `      - '${DASHBOARD_SRC_PROFILE}'\n`;
    content += '    container_name: dashboard-src-installer-${NODE_VERSION}\n';
    content += '    volumes:\n';
    content += "      - '${SRC_DASHBOARD}:/home/node/kbn'\n";
    content += "    user: '1000:1000'\n";
    content += '    working_dir: /home/node/kbn\n';
    content += '    entrypoint: /bin/bash\n';
    content += '    command: >\n';
    content += "      -c '\n";
    content += '        marker_osd_bootstrap="/home/node/kbn/.NO_COMMIT_MARKER_OSD_BOOTSTRAP_WAS_DONE"\n';
    content += '        root_app_dir="/home/node/kbn"\n\n';
    content += '        if [ -f "$$marker_osd_bootstrap" ]; then\n';
    content += '          echo "File $$marker_osd_bootstrap was found. Skip setup.";\n';
    content += '          exit 0;\n';
    content += '        fi\n';
    content += '        echo "Initializating setup"\n';
    content += '        cd $$root_app_dir\n';
    content += '        yarn osd clean && yarn osd bootstrap && touch $$marker_osd_bootstrap\n';
    content += '        echo "Setup was finished"\n';
    content += "      '\n";
  }

  content += '  osd:\n';
  const volumeEntries: string[] = [];

  if (useDashboardFromSource) {
    content += '    depends_on:\n';
    content += '      dashboard-src-installer:\n';
    content += '        condition: service_completed_successfully\n';
    content += '    image: node:${NODE_VERSION}\n';
    content += '    profiles:\n';
    content += `      - '${DASHBOARD_SRC_PROFILE}'\n`;
    content += '    ports:\n';
    content += "    entrypoint: ['/bin/bash', '/entrypoint.sh']\n";
    content += '    working_dir: /home/node/kbn\n';

    volumeEntries.push("      - '${SRC_DASHBOARD}:/home/node/kbn'");
    if (includeSecurityPlugin) {
      volumeEntries.push("      - '${SRC_SECURITY_PLUGIN}:/home/node/kbn/plugins/wazuh-security-dashboards'");
    }
    volumeEntries.push(`      - ${DASHBOARD_ENTRYPOINT_PATH}:/entrypoint.sh:ro`);
  }

  for (const repo of externalRepositories) {
    volumeEntries.push(`      - '${repo}:/home/node/kbn/plugins/${repo}'`);
  }

  if (volumeEntries.length > 0) {
    content += '    volumes:\n';
    content += `${volumeEntries.join('\n')}\n`;
  }

  if (externalRepositories.length > 0) {
    content += 'volumes:\n';
    for (const repo of externalRepositories) {
      const repoPath = repositoryEnvMap.get(toRepositoryEnvVar(repo));
      if (!repoPath) {
        throw new ComposeOverrideError(`Repository path for '${repo}' not resolved.`);
      }
      content += `  ${repo}:\n`;
      content += `    driver: local\n`;
      content += `    driver_opts:\n`;
      content += `      type: none\n`;
      content += `      o: bind\n`;
      content += `      device: ${repoPath}\n`;
    }
  }

  writeFile(OVERRIDE_COMPOSE_FILE, content);
  return OVERRIDE_COMPOSE_FILE;
}
