const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');

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
      if (node.getKind() === SyntaxKind.CallExpression) {
        const call = node.asKindOrThrow(SyntaxKind.CallExpression);
        const fnName = call.getExpression().getText();
        if (fnName === 'webDocumentationLink') {
          const [firstArg] = call.getArguments();
          if (firstArg && firstArg.getKind() === SyntaxKind.StringLiteral) {
            // collect "/some/path"
            urlPaths.add({
              filename: filename,
              wazuh_docs_sub_path: firstArg.getLiteralValue(),
            });
          }
        }
      }
    });
  }

  return Array.from(urlPaths);
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
