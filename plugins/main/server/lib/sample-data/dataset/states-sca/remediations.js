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

/**
 * Verbatim `remediation` values of the CIS Ubuntu 24.04 SCA policy (wazuh/wazuh branch
 * sca/40412-example-markdown-remediation). `REAL_nn` is searchable as check.id `CUST-REAL-nn`.
 */
// REAL_01: policy check 35500
const REAL_01 =
  'Run the following script to unload and disable the cramfs module:\n\nIf the cramfs kernel module is available in ANY installed kernel:\n\n- Create a file ending in `.conf` with `install cramfs /bin/false` in the `/etc/modprobe.d/` directory\n- Create a file ending in `.conf` with `blacklist cramfs` in the `/etc/modprobe.d/` directory\n- Run `modprobe -r cramfs 2>/dev/null; rmmod cramfs 2>/dev/null` to remove cramfs from the kernel\n\nIf the cramfs kernel module is not available on the system, or pre-compiled into the kernel, no remediation is necessary\n\n```\n#!/usr/bin/env bash.\n```\n';

// REAL_02: policy check 35509
const REAL_02 =
  'If the module is available in the running kernel:\n\n- Unload the filesystem kernel module from the kernel.\n- Create a file ending in `.conf` with `install <module> /bin/false` in the `/etc/modprobe.d/` directory.\n- Create a file ending in `.conf` with a deny list entry for the module in the `/etc/modprobe.d/` directory.\n\n**WARNING:** unloading, disabling, or denylisting filesystem modules that are in use on the system may be **FATAL**. It is extremely important to thoroughly review the filesystems returned by the audit before following the remediation procedure.\n\nExample of unloading the gfs2 kernel module:\n\n```\n# modprobe -r gfs2 2>/dev/null\n# rmmod gfs2 2>/dev/null\n```\n\nExample of fully disabling the gfs2 kernel module:\n\n```\n# printf "%s\\n" "blacklist gfs2" "install gfs2 /bin/false" >> /etc/modprobe.d/gfs2.conf\n```\n';

// REAL_03: policy check 35553
const REAL_03 =
  "If A user profile is already created run the following commands to set and enable the text banner message on the login screen:\n\n```\n# gsettings set org.gnome.login-screen banner-message-text 'Authorized uses only. All activity may be monitored and reported'\n# gsettings set org.gnome.login-screen banner-message-enable true\n```\n\n**Note:**\n- `banner-message-text` may be set in accordance with local site policy\n- `gsettings` commands in this section MUST be done from a command window on a graphical desktop or an error will be returned.\n- The system must be restarted after all gsettings configurations have been set in order for CIS-CAT Assessor to appropriately assess.\n\nOR, if A user profile does not exist:\n\n1. Create or edit the gdm profile in the `/etc/dconf/profile/gdm` with the following lines:\n\n```\nuser-db:user\nsystem-db:gdm\nfile-db:/usr/share/gdm/greeter-dconf-defaults\n```\n\n**Note:** gdm is the name of a dconf database.\n\n2. Create a gdm keyfile for machine-wide settings in `/etc/dconf/db/gdm.d/01- banner-message`:\n\n```\n[org/gnome/login-screen]\nbanner-message-enable=true\nbanner-message-text='Type the banner message here.'\n```\n\n3. Update the system databases\n\n```\n# dconf update\n```\n\n**Note:**\n- Users must log out and back in again before the system-wide settings take effect.\n- There is no character limit for the banner message. gnome-shell autodetects longer stretches of text and enters two column mode.\n- The banner message cannot be read from an external file.\n";

// REAL_04: policy check 35601
const REAL_04 =
  'If at is installed on the system: Run the following script to:\n\n- `/etc/at.allow`:\n  - Create the file if it doesn\'t exist\n  - Change owner or user root\n  - If group daemon exists, change to group daemon, else change group to root\n  - Change mode to 640 or more restrictive\n- If `/etc/at.deny` exists:\n  - Change owner or user root\n  - If group daemon exists, change to group daemon, else change group to root\n  - Change mode to 640 or more restrictive\n\n```\n#!/usr/bin/env bash\n{\ngrep -Pq -- \'^daemon\\b\' /etc/group && l_group="daemon" || l_group="root"\n[ ! -e "/etc/at.allow" ] && touch /etc/at.allow\nchown root:"$l_group" /etc/at.allow\nchmod u-x,g-wx,o-rwx /etc/at.allow\n[ -e "/etc/at.deny" ] && chown root:"$l_group" /etc/at.deny\n[ -e "/etc/at.deny" ] && chmod u-x,g-wx,o-rwx /etc/at.deny\n}.\n```\n';

// REAL_05: policy check 35640
const REAL_05 =
  'Run the following script to set ownership and permissions on `/etc/ssh/sshd_config` and files ending in `.conf` in the `/etc/ssh/sshd_config.d` directory:\n\n```\n#!/usr/bin/env bash\n{\nchmod u-x,og-rwx /etc/ssh/sshd_config\nchown root:root /etc/ssh/sshd_config\nwhile IFS= read -r -d $\'\\0\' l_file; do\n    if [ -e "$l_file" ]; then\n        chmod u-x,og-rwx "$l_file"\n        chown root:root "$l_file"\n    fi\ndone < <(find /etc/ssh/sshd_config.d -type f -print0 2>/dev/null)\n}\n```\n\nIf other locations are listed in an Include statement, `*.conf` files in these locations access should also be modified.\n';

// REAL_06: policy check 35543
const REAL_06 =
  'Add the following line to `/etc/security/limits.conf` or a `/etc/security/limits.d/*` file:\n\n```\n* hard core 0\n```\n\nSet the following parameter in `/etc/sysctl.conf` or a file in `/etc/sysctl.d/` ending in `.conf`:\n\n- `fs.suid_dumpable = 0`\n\nExample:\n\n```\n# printf "\\n%s" "fs.suid_dumpable = 0" >> /etc/sysctl.d/60-fs_sysctl.conf\n```\n\nRun the following command to set the active kernel parameter:\n\n```\n# sysctl -w fs.suid_dumpable=0\n```\n\n**Note:** If these settings appear in a canonically later file, or later in the same file, these settings will be overwritten\n\nIf systemd-coredump is installed: edit `/etc/systemd/coredump.conf` and add/modify the following lines:\n\n```\nStorage=none\nProcessSizeMax=0\n```\n\nRun the command:\n\n```\nsystemctl daemon-reload.\n```\n';

// REAL_07: policy check 35600
const REAL_07 =
  "If cron is installed on the system: Run the following script to:\n\n- Create `/etc/cron.allow` if it doesn't exist\n- Change owner to user root\n- Change group owner to group root or group crontab if it exists\n- Change mode to 640 or more restrictive\n\n```\n#!/usr/bin/env bash\n{\n[ ! -e \"/etc/cron.deny\" ] && touch /etc/cron.allow\nchmod u-x,g-wx,o-rwx /etc/cron.allow\nif grep -Pq -- '^\\h*crontab\\:' /etc/group; then\nchown root:crontab /etc/cron.allow\nelse\nchown root:root /etc/cron.allow\nfi\n}\n```\n\nIf `/etc/cron.deny` exists, run the following script to:\n\n- Change owner to user root\n- Change group owner to group root or group crontab if it exists\n- Change mode to 640 or more restrictive\n\n```\n#!/usr/bin/env bash\n{\nif [ -e \"/etc/cron.deny\" ]; then\nchmod u-x,g-wx,o-rwx /etc/cron.deny\nif grep -Pq -- '^\\h*crontab\\:' /etc/group; then\nchown root:crontab /etc/cron.deny\nelse\nchown root:root /etc/cron.deny\nfi\nfi\n}\n```\n\n**Note:** On systems where cron is configured to use the group crontab, if the group crontab is not set as the owner of cron.allow, then cron will deny access to all users and you will see an error similar to: You (<USERNAME>) are not allowed to use this program (crontab) See crontab(1) for more information.\n";

// REAL_08: policy check 35681
const REAL_08 =
  "Run the following command:\n\n```\n# grep -Pl -- '\\bpam_pwquality\\.so\\h+([^#\\n\\r]+\\h+)?(minclass|[dulo]credit)\\b' /usr/share/pam-configs/*\n```\n\nEdit any returned files and remove the minclass, dcredit, ucredit, lcredit, and ocredit arguments from the `pam_pwquality.so` line(s)\n\nCreate or modify a file ending in `.conf` in the `/etc/security/pwquality.conf.d/` directory or the file `/etc/security/pwquality.conf` and add or modify the following line(s) to set complexity according to local site policy:\n\n- `minclass` = _N_\n- `dcredit` = _N_ # Value should be either 0 or a number proceeded by a minus (- ) symbol\n- `ucredit` = -1 # Value should be either 0 or a number proceeded by a minus (-) symbol\n- `ocredit` = -1 # Value should be either 0 or a number proceeded by a minus (-) symbol\n- `lcredit` = -1 # Value should be either 0 or a number proceeded by a minus (-) symbol\n\nExample 1 - Set minclass = 3:\n\n```\n#!/usr/bin/env bash\n{\nsed -ri 's/^\\s*minclass\\s*=/# &/' /etc/security/pwquality.conf\nsed -ri 's/^\\s*[dulo]credit\\s*=/# &/' /etc/security/pwquality.conf\n[ ! -d /etc/security/pwquality.conf.d/ ] && mkdir /etc/security/pwquality.conf.d/\nprintf '\\n%s' \"minclass = 3\" > /etc/security/pwquality.conf.d/50- pwcomplexity.conf\n}\n```\n\nExample 2 - set dcredit = -1, ucredit = -1, and lcredit = -1:\n\n```\n#!/usr/bin/env bash\n{\nsed -ri 's/^\\s*minclass\\s*=/# &/' /etc/security/pwquality.conf\nsed -ri 's/^\\s*[dulo]credit\\s*=/# &/' /etc/security/pwquality.conf\n[ ! -d /etc/security/pwquality.conf.d/ ] && mkdir /etc/security/pwquality.conf.d/\nprintf '%s\\n' \"dcredit = -1\" \"ucredit = -1\" \"lcredit = -1\" > /etc/security/pwquality.conf.d/50-pwcomplexity.conf\n}.\n";

// REAL_09: policy check 35654
const REAL_09 =
  'Edit the `/etc/ssh/sshd_config` file and add/modify the `MACs` line to contain a comma separated list of the site unapproved (weak) MACs preceded with a - above any `Include` entries:\n\nExample:\n\n```\nMACs -hmac-md5,hmac-md5-96,hmac-ripemd160,hmac-sha1-96,umac- 64@openssh.com,hmac-md5-etm@openssh.com,hmac-md5-96-etm@openssh.com,hmac- ripemd160-etm@openssh.com,hmac-sha1-96-etm@openssh.com,umac-64- etm@openssh.com,umac-128-etm@openssh.com\n```\n\nIf CVE-2023-48795 has not been reviewed and addressed, the following etm MACs should be added to the exclude list: `hmac-sha1-etm@openssh.com,hmac-sha2-256- etm@openssh.com,hmac-sha2-512-etm@openssh.com`\n\n**Note:** First occurrence of an option takes precedence. If Include locations are enabled, used, and order of precedence is understood in your environment, the entry may be created in a file in Include location.\n';

// REAL_10: policy check 35722
const REAL_10 =
  'Run the following script to update permissions and ownership on files in /var/log. Although the script is not destructive, ensure that the output of the audit procedure is captured in the event that the remediation causes issues.\n\n```\n#!/usr/bin/env bash\n{\na_output2=()\nf_file_test_fix()\n{\na_out2=() maxperm="$( printf \'%o\' $(( 0777 & ~$perm_mask)) )"\nif [ $(( $l_mode & $perm_mask )) -gt 0 ]; then\na_out2+=(" o Mode: \\"$l_mode\\" should be \\"$maxperm\\" or more restrictive" " x Removing excess permissions")\nchmod "$l_rperms" "$l_fname"\nfi\nif [[ ! "$l_user" =~ $l_auser ]]; then\na_out2+=(" o Owned by: \\"$l_user\\" and should be owned by \\"${l_auser//|/ or }\\"" " x Changing ownership to: \\"$l_fix_account\\"")\nchown "$l_fix_account" "$l_fname"\nfi\nif [[ ! "$l_group" =~ $l_agroup ]]; then\na_out2+=(" o Group owned by: \\"$l_group\\" and should be group owned by \\"${l_agroup//|/ or }\\"" " x Changing group ownership to: \\"$l_fix_account\\"")\nchgrp "$l_fix_account" "$l_fname"\nfi\n[ "${#a_out2[@]}" -gt 0 ] && a_output2+=(" - File: \\"$l_fname\\" is:" "${a_out2[@]}")\n}\nl_fix_account=\'root\'\nwhile IFS= read -r -d $\'\\0\' l_file; do\nwhile IFS=: read -r l_fname l_mode l_user l_group; do\nif grep -Pq -- \'\\/(apt)\\h*$\' <<< "$(dirname "$l_fname")"; then\nperm_mask=\'0133\'\nl_rperms="u-x,go-wx"\nl_auser="root"\nl_agroup="(root|adm)"; f_file_test_fix\nelse\ncase "$(basename "$l_fname")" in\nlastlog | lastlog.* | wtmp | wtmp.* | wtmp-* | btmp | btmp.* | btmp-* | README)\nperm_mask=\'0113\'\nl_rperms="ug-x,o-wx"\nl_auser="root"\nl_agroup="(root|utmp)"\nf_file_test_fix\n;;\ncloud-init.log* | localmessages* | waagent.log*)\nperm_mask=\'0133\'\nl_rperms="u-x,go-wx"\nl_auser="(root|syslog)"\nl_agroup="(root|adm)"\nfile_test_fix\n;;\nsecure | auth.log | syslog | messages)\nperm_mask=\'0137\'\nl_rperms="u-x,g-wx,o-rwx"\nl_auser="(root|syslog)"\nl_agroup="(root|adm)"\nf_file_test_fix\n;;\nSSSD | sssd)\nperm_mask=\'0117\'\nl_rperms="ug-x,o-rwx"\nl_auser="(root|SSSD)"\nl_agroup="(root|SSSD)"\nf_file_test_fix\n;;\ngdm | gdm3)\nperm_mask=\'0117\'\nl_rperms="ug-x,o-rwx"\nl_auser="root"\nl_agroup="(root|gdm|gdm3)"\nf_file_test_fix\n;;\n*.journal | *.journal~)\nperm_mask=\'0137\'\nl_rperms="u-x,g-wx,o-rwx"\nl_auser="root"\nl_agroup="(root|systemd-journal)"\nf_file_test_fix\n;;\n*)\nperm_mask=\'0137\'\nl_rperms="u-x,g-wx,o-rwx"\nl_auser="(root|syslog)"\nl_agroup="(root|adm)"\nif [ "$l_user" = "root" ] || ! grep -Pq -- "^\\h*$(awk -F: \'$1=="\'"$l_user"\'" {print $7}\' /etc/passwd)\\b" /etc/shells; then\n! grep -Pq -- "$l_auser" <<< "$l_user" && l_auser="(root|syslog|$l_user)"\n! grep -Pq -- "$l_agroup" <<< "$l_group" && l_agroup="(root|adm|$l_group)"\nfi\nf_file_test_fix\n;;\nesac\nfi\ndone < <(stat -Lc \'%n:%#a:%U:%G\' "$l_file")\ndone < <(find -L /var/log -type f \\( -perm /0137 -o ! -user root -o ! - group root \\) -print0)\nif [ "${#a_output2[@]}" -le 0 ]; then\n# If all files passed, then we report no changes\na_output+=(" - All files in \\"/var/log/\\" have appropriate permissions and ownership")\nprintf \'\\n%s\' "- All files in \\"/var/log/\\" have appropriate permissions and ownership" " o No changes required" ""\nelse\nprintf \'\\n%s\' "${a_output2[@]}" ""\nfi\n}\n```\n\n**Note:** You may also need to change the configuration for your logging software or services for any logs that had incorrect permissions. If there are services that log to other locations, ensure that those log files have the appropriate permissions.\n';

const REMEDIATION_VARIANTS = {
  ALL,
  LIST,
  CODE,
  LINKS,
  LEGACY,
  SIMPLE,
  REAL_01,
  REAL_02,
  REAL_03,
  REAL_04,
  REAL_05,
  REAL_06,
  REAL_07,
  REAL_08,
  REAL_09,
  REAL_10,
};

module.exports = {
  REMEDIATION_VARIANTS,
};
