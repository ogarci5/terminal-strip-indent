import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {isClaudeCode, readOptions, stripIndent} from './strip.js';

let fail = 0;
function check(name, got, want) {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fail++;
    print(`${ok ? 'ok  ' : 'FAIL'} ${name} -> ${JSON.stringify(got)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`);
}

const STRICT = {bullet: true, skipFirstLine: false};
const NO_BULLET = {bullet: false, skipFirstLine: false};
const CLAUDE = {bullet: true, skipFirstLine: true};

// [input, options, expected]
const cases = [
    ['  a\n  b', STRICT, 'a\nb'],
    ['  a\n\n  b\n', STRICT, 'a\n\nb\n'],
    ['  a\n \n  b', STRICT, 'a\n\nb'],
    ['    a\n    b', STRICT, '  a\n  b'],
    ['  a\nb', STRICT, null],
    [' a\n  b', STRICT, null],
    ['a', STRICT, null],
    ['\n\n', STRICT, null],
    ['  ', STRICT, null],
    ['\tx', STRICT, null],
    ['● ┌─┐\n  │x│\n  └─┘\n', STRICT, '┌─┐\n│x│\n└─┘\n'],
    ['⏺ a\n    b', STRICT, 'a\n  b'],
    ['● a', STRICT, 'a'],
    ['● a\nb', STRICT, null],
    ['  ● a\n  b', STRICT, '● a\nb'],
    ['a\n● b\n  c', STRICT, null],
    ['●a\n  b', STRICT, null],
    // bullet disabled: a bullet line is an ordinary line without the margin
    ['● ┌─┐\n  │x│\n  └─┘\n', NO_BULLET, null],
    ['⏺ a\n    b', NO_BULLET, null],
    ['● a', NO_BULLET, null],
    ['  ● a\n  b', NO_BULLET, '● a\nb'],
    ['  a\n  b', NO_BULLET, 'a\nb'],
    // strict rule: a selection that starts mid-line, and code whose body is indented under its first line
    ['notes the quotes, and the side\n  effect mentions it.', STRICT, null],
    ['def f():\n  return 1', STRICT, null],
    // Claude Code tab: the first line is left out of the check
    ['notes the quotes, and the side\n  effect mentions it.', CLAUDE, 'notes the quotes, and the side\neffect mentions it.'],
    ['def f():\n      return 1', CLAUDE, 'def f():\n    return 1'],
    ['partial\n\n  b\n', CLAUDE, 'partial\n\nb\n'],
    [' x\n  y', CLAUDE, 'x\ny'],
    ['    a\n  b', CLAUDE, '  a\nb'],
    ['  a\n  b', CLAUDE, 'a\nb'],
    ['● a\n  b', CLAUDE, 'a\nb'],
    ['partial\nb', CLAUDE, null],
    ['partial\n  a\nb', CLAUDE, null],
    ['partial', CLAUDE, null],
    ['partial\n\n', CLAUDE, null],
];
for (const [input, options, want] of cases)
    check(`${JSON.stringify(input)} ${JSON.stringify(options)}`, stripIndent(input, options), want);

// [window title, expected]
const titles = [
    ['✳ Fedora terminal clipboard leading-space stripper — claude --resume 0123abcd-0000-0000-0000-000000000000', true],
    ['◐ Fedora terminal clipboard leading-space stripper — claude --resume 0123abcd-0000-0000-0000-000000000000', true],
    ['✳ E2E CRAFT Weakly Supervised Training — claude', true],
    ['claude', false],
    ['~/claude-notes — bash', false],
    ['notes — claudette', false],
    ['notes — vim claude.md', false],
    ['notes - claude', false],
    ['', false],
    [null, false],
];
for (const [title, want] of titles)
    check(`isClaudeCode(${JSON.stringify(title)})`, isClaudeCode(title), want);

// Settings: compile the schema and read it through a keyfile backend, the way dconf values arrive.
const here = GLib.path_get_dirname(GLib.filename_from_uri(import.meta.url)[0]);
const tmp = GLib.dir_make_tmp('strip-indent-XXXXXX');
const [compiled, , err] = GLib.spawn_sync(null,
    ['glib-compile-schemas', '--strict', `--targetdir=${tmp}`, `${here}/schemas`],
    null, GLib.SpawnFlags.SEARCH_PATH, null);
if (!compiled)
    throw new Error(new TextDecoder().decode(err));
const schema = Gio.SettingsSchemaSource.new_from_directory(tmp, null, false)
    .lookup('org.gnome.shell.extensions.terminal-strip-indent', false);

function optionsFrom(keyfile) {
    const path = `${tmp}/keyfile`;
    GLib.file_set_contents(path, `[org/gnome/shell/extensions/terminal-strip-indent]\n${keyfile}`);
    const backend = Gio.keyfile_settings_backend_new(path, '/', null);
    const {terminals, ...rest} = readOptions(new Gio.Settings({settings_schema: schema, backend}));
    return {terminals: [...terminals], ...rest};
}

const DEFAULT_TERMINALS = ['org.gnome.Ptyxis', 'org.gnome.Ptyxis.Devel', 'org.gnome.Terminal',
    'org.gnome.Console', 'kitty', 'Alacritty', 'org.wezfurlong.wezterm', 'com.mitchellh.ghostty', 'foot'];
check('defaults', optionsFrom(''), {terminals: DEFAULT_TERMINALS, bullet: true, claudeFirstLine: true});
check("bullet='disabled'", optionsFrom("bullet='disabled'\n").bullet, false);
check("bullet='enabled'", optionsFrom("bullet='enabled'\n").bullet, true);
check("bullet='off' (not a choice, falls back to default)", optionsFrom("bullet='off'\n").bullet, true);
check("first-line='strict'", optionsFrom("first-line='strict'\n").claudeFirstLine, false);
check("first-line='claude'", optionsFrom("first-line='claude'\n").claudeFirstLine, true);
check("first-line='off' (not a choice, falls back to default)", optionsFrom("first-line='off'\n").claudeFirstLine, true);
check("terminals=['org.gnome.Ptyxis', 'code']",
    optionsFrom("terminals=['org.gnome.Ptyxis', 'code']\n").terminals, ['org.gnome.Ptyxis', 'code']);
check('terminals=@as []', optionsFrom('terminals=@as []\n').terminals, []);

for (const name of ['gschemas.compiled', 'keyfile'])
    GLib.unlink(`${tmp}/${name}`);
GLib.rmdir(tmp);

print(fail ? `${fail} failed` : 'all passed');
