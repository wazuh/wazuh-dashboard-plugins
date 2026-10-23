/*
 * Dev tool: render markdown text with the same renderers the dashboard uses.
 *
 *   echo 'sudo visudo -f <PATH TO FILE>' | node scripts/render-markdown.js --config sca
 *   node scripts/render-markdown.js --config mitre --file description.md --text
 *
 * Run it inside the osd-dev container (needs OSD's setup_node_env to load the TypeScript).
 */
require('../../../src/setup_node_env');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const {
  renderMarkdown,
} = require('../public/components/common/util/markdown/markdown-renderer');

const CONFIGS = {
  mitre: { copyableCodeBlocks: false }, // shared renderer: MITRE ATT&CK, CTI release notes
  sca: { copyableCodeBlocks: true }, // SCA check remediation
};

const usage = `Usage: node scripts/render-markdown.js [--config mitre|sca] [--file <path>] [--text] [markdown]
  -c, --config  Renderer to use (default: mitre)
  -f, --file    Read the markdown from a file (otherwise the argument or stdin)
  -t, --text    Print only the visible text instead of the HTML`;

const args = process.argv.slice(2);
const opts = { config: 'mitre', file: undefined, text: false, positional: [] };
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '-c' || arg === '--config') opts.config = args[++i];
  else if (arg === '-f' || arg === '--file') opts.file = args[++i];
  else if (arg === '-t' || arg === '--text') opts.text = true;
  else if (arg === '-h' || arg === '--help') {
    console.log(usage);
    process.exit(0);
  } else opts.positional.push(arg);
}

if (!CONFIGS[opts.config]) {
  console.error(`Unknown config "${opts.config}".\n${usage}`);
  process.exit(1);
}

const markdown =
  opts.file !== undefined
    ? fs.readFileSync(opts.file, 'utf8')
    : opts.positional.length
    ? opts.positional.join(' ')
    : fs.readFileSync(0, 'utf8');

const { window } = new JSDOM('');
const sanitize = html => createDOMPurify(window).sanitize(html);
const html = renderMarkdown(markdown, CONFIGS[opts.config], sanitize);

console.log(
  opts.text
    ? new JSDOM(`<body>${html}</body>`).window.document.body.textContent.trim()
    : html,
);
