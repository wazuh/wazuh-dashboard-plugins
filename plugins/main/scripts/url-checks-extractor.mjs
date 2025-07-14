import { Project, SyntaxKind } from 'ts-morph';
import path from 'path';
import { fileURLToPath } from 'url';
import packageJson from '../package.json' with { type: "json" };

const DOCUMENTATION_WEB_BASE_URL = 'https://documentation.wazuh.com';
export const PLUGIN_VERSION = packageJson.version;
export const PLUGIN_VERSION_SHORT = packageJson.version.split('.').splice(0, 2).join('.');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function webDocumentationLink(urlPath, version = PLUGIN_VERSION_SHORT) {
  return `${DOCUMENTATION_WEB_BASE_URL}/${version}/${urlPath}`;
}

async function findUrlPaths(tsConfigPath) {
  // 1. Initialize a ts-morph Project
  const project = new Project({
    tsConfigFilePath: tsConfigPath,
  });

  const urlPaths = new Set();

  // 3. Walk each source file
  for (const sourceFile of project.getSourceFiles()) {
    // Ignore test files
    const filename = sourceFile.getFilePath();

    if (filename.includes('node_modules')) continue;
    if (filename.includes('dist')) continue;
    if (filename.includes('build')) continue;
    if (filename.includes('coverage')) continue;
    if (filename.includes('scripts')) continue;
    if (filename.includes('test')) continue;
    if (filename.includes('example')) continue;
    if (filename.includes('demo')) continue;
    if (filename.includes('mock')) continue;
    if (/\.test\.(js|ts)x?$/.test(filename)) continue;

    sourceFile.forEachDescendant(node => {
      if (node.getKind() !== SyntaxKind.CallExpression) return;

      const call = node.asKindOrThrow(SyntaxKind.CallExpression);
      const fnName = call.getExpression().getText();

      if (fnName !== 'webDocumentationLink') return;

      const [firstArg, secondArg] = call.getArguments();

      if (!isValidStringLiteral(firstArg)) return;

      urlPaths.add({
        filename: filename,
        wazuh_docs_sub_path: webDocumentationLink(
          firstArg.getLiteralValue(),
          isValidStringLiteral(secondArg) ? secondArg.getLiteralValue() : undefined,
        ),
      });
    });
  }

  return Array.from(urlPaths);
}

function isValidStringLiteral(arg) {
  return arg && arg.getKind() === SyntaxKind.StringLiteral;
}

async function main() {
  try {
    const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
    console.log('Using tsconfig path:', tsConfigPath);
    const urlPaths = await findUrlPaths(tsConfigPath);
    console.log(JSON.stringify(urlPaths, null, 2));
  } catch (error) {
    console.error('Error extracting URL paths:', error);
    process.exit(1);
  }
}

main();
