/**
 * Markdown remediations for the SCA sample data. They exercise the cases handled by the
 * `Markdown` component that renders `check.remediation` in the check details. The `ALL`
 * variant tags every case with a `[Mnn]` marker so each one can be located in the UI.
 *
 * `check.remediation` is a keyword field with `ignore_above: 4096`: keep every variant short.
 */
const lines = (...items) => items.join('\n');

const ALL = lines(
  '[M01] Edit `/etc/ssh/sshd_config` and set the parameter described below.',
  '',
  '[M02] **Bold text**, *italic text* and ***both***.',
  '',
  '[M03] First line of a paragraph',
  'second line right after a single newline.',
  '',
  '[M04] Ordered list:',
  '',
  '1. Back up the configuration',
  '2. Apply the change',
  '3. Restart the service',
  '',
  '[M05] Unordered list with nesting:',
  '',
  '- Level one',
  '  - Level two',
  '    - Level three',
  '- Another level one item',
  '',
  '[M06] Fenced code block with language:',
  '',
  '```bash',
  'cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak',
  "sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config",
  'systemctl restart sshd',
  '```',
  '',
  '[M07] Fenced code block without language and with special characters:',
  '',
  '```',
  '<tag attr="value"> & "quotes" && echo $HOME',
  '```',
  '',
  '[M08] Tilde fence:',
  '',
  '~~~',
  'modprobe -r cramfs',
  '~~~',
  '',
  '[M09] Very long unbroken command:',
  '',
  '```',
  `find / -xdev -type f -perm -0002 -not -path "/proc/*" -not -path "/sys/*" -exec ls -l {} + | awk '{print $1,$3,$4,$9}' | sort -u > /var/tmp/world-writable-files-report-${'x'.repeat(
    60,
  )}.txt`,
  '```',
  '',
  '[M10] Indented code block (4 spaces):',
  '',
  '    chmod 600 /etc/ssh/sshd_config',
  '    chown root:root /etc/ssh/sshd_config',
  '',
  '[M11] Empty fenced block:',
  '',
  '```',
  '```',
  '',
  '[M12] Bare URL: https://documentation.wazuh.com/current/user-manual/capabilities/sec-config-assessment/index.html',
  '',
  '[M13] Markdown link: [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)',
  '',
  '### [M14] Heading level 3',
  '',
  '> Blockquote: back up the file before changing it.',
  '',
  '[M15] Table:',
  '',
  '| Parameter | Value |',
  '| --- | --- |',
  '| PermitRootLogin | no |',
  '| MaxAuthTries | 4 |',
  '',
  '[M16] Typographer: (c) 2026 -- "quoted text" and more...',
  '',
  '[M17] Raw HTML: <b>html bold</b> and <kbd>Ctrl</kbd>+<kbd>C</kbd>',
  '',
  "[M18] Script tag (must not render): <script>alert('m18')</script>",
  '',
  '[M19] Event handler (must be stripped): <img src="x" onerror="alert(\'m19\')">',
  '',
  "[M20] JavaScript link (must not work): [click me](javascript:alert('m20'))",
  '',
  '---',
  '',
  '[M21] Legacy flat text: Run the following script to unload and disable the cramfs module: - IF - the cramfs kernel module is available in ANY installed kernel: - Create a file ending in .conf with install cramfs /bin/false in the /etc/modprobe.d/ directory #!/usr/bin/env bash.',
);

const LIST = lines(
  'Apply the following steps:',
  '',
  '1. Open the configuration file',
  '2. Set the value:',
  '   - `enabled = true`',
  '   - `level = 2`',
  '3. Restart the service',
);

const CODE = lines(
  'Run the following commands as root:',
  '',
  '```bash',
  'modprobe -r cramfs',
  'echo "install cramfs /bin/false" > /etc/modprobe.d/cramfs.conf',
  'echo "blacklist cramfs" >> /etc/modprobe.d/cramfs.conf',
  '```',
);

const LINKS = lines(
  'See https://documentation.wazuh.com and the [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/).',
);

const LEGACY =
  'Edit or create a file in the /etc/modprobe.d/ directory ending in .conf with a line that reads install cramfs /bin/false and a line the reads blacklist cramfs. Example: # printf "install cramfs /bin/false blacklist cramfs " >> /etc/modprobe.d/cramfs.conf Run the following command to unload the cramfs module: # modprobe -r cramfs.';

const SIMPLE = 'Set the registry key to the expected value.';

const REMEDIATION_VARIANTS = { ALL, LIST, CODE, LINKS, LEGACY, SIMPLE };

module.exports = {
  REMEDIATION_VARIANTS,
};
