import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {readOptions, stripIndent} from './strip.js';

let fail = 0;
function check(name, got, want) {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fail++;
    print(`${ok ? 'ok  ' : 'FAIL'} ${name} -> ${JSON.stringify(got)}${ok ? '' : ` (want ${JSON.stringify(want)})`}`);
}

// [input, bullet setting, expected]
const cases = [
    ['  a\n  b', true, 'a\nb'],
    ['  a\n\n  b\n', true, 'a\n\nb\n'],
    ['  a\n \n  b', true, 'a\n\nb'],
    ['    a\n    b', true, '  a\n  b'],
    ['  a\nb', true, null],
    [' a\n  b', true, null],
    ['a', true, null],
    ['\n\n', true, null],
    ['  ', true, null],
    ['\tx', true, null],
    ['● ┌─┐\n  │x│\n  └─┘\n', true, '┌─┐\n│x│\n└─┘\n'],
    ['⏺ a\n    b', true, 'a\n  b'],
    ['● a', true, 'a'],
    ['● a\nb', true, null],
    ['  ● a\n  b', true, '● a\nb'],
    ['a\n● b\n  c', true, null],
    ['●a\n  b', true, null],
    // bullet disabled: a bullet line is an ordinary line without the margin
    ['● ┌─┐\n  │x│\n  └─┘\n', false, null],
    ['⏺ a\n    b', false, null],
    ['● a', false, null],
    ['  ● a\n  b', false, '● a\nb'],
    ['  a\n  b', false, 'a\nb'],
];
for (const [input, bullet, want] of cases)
    check(`${JSON.stringify(input)} bullet=${bullet}`, stripIndent(input, bullet), want);

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
    const {terminals, bullet} = readOptions(new Gio.Settings({settings_schema: schema, backend}));
    return {terminals: [...terminals], bullet};
}

const DEFAULT_TERMINALS = ['org.gnome.Ptyxis', 'org.gnome.Ptyxis.Devel', 'org.gnome.Terminal',
    'org.gnome.Console', 'kitty', 'Alacritty', 'org.wezfurlong.wezterm', 'com.mitchellh.ghostty', 'foot'];
check('defaults', optionsFrom(''), {terminals: DEFAULT_TERMINALS, bullet: true});
check("bullet='disabled'", optionsFrom("bullet='disabled'\n").bullet, false);
check("bullet='enabled'", optionsFrom("bullet='enabled'\n").bullet, true);
check("bullet='off' (not a choice, falls back to default)", optionsFrom("bullet='off'\n").bullet, true);
check("terminals=['org.gnome.Ptyxis', 'code']",
    optionsFrom("terminals=['org.gnome.Ptyxis', 'code']\n").terminals, ['org.gnome.Ptyxis', 'code']);
check('terminals=@as []', optionsFrom('terminals=@as []\n').terminals, []);

for (const name of ['gschemas.compiled', 'keyfile'])
    GLib.unlink(`${tmp}/${name}`);
GLib.rmdir(tmp);

print(fail ? `${fail} failed` : 'all passed');
