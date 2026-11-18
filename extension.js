import Meta from 'gi://Meta';
import St from 'gi://St';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {stripIndent} from './strip.js';

// Window classes (Wayland app ids) whose copies are rewritten.
const TERMINALS = new Set([
    'org.gnome.Ptyxis',
    'org.gnome.Ptyxis.Devel',
    'org.gnome.Terminal',
    'org.gnome.Console',
    'kitty',
    'Alacritty',
    'org.wezfurlong.wezterm',
    'com.mitchellh.ghostty',
    'foot',
]);

export default class TerminalStripIndent extends Extension {
    enable() {
        this._clipboard = St.Clipboard.get_default();
        this._selection = global.display.get_selection();
        this._lastSet = null;
        this._ownerChangedId = this._selection.connect('owner-changed', (_sel, type) => {
            if (type !== Meta.SelectionType.SELECTION_CLIPBOARD)
                return;
            const wmClass = global.display.focus_window?.get_wm_class();
            if (!TERMINALS.has(wmClass))
                return;
            this._clipboard.get_text(St.ClipboardType.CLIPBOARD, (_cb, text) => {
                // Our own write fires owner-changed again; skip it so "    x" is not stripped twice.
                if (!text || text === this._lastSet)
                    return;
                const stripped = stripIndent(text);
                if (stripped === null)
                    return;
                this._lastSet = stripped;
                this._clipboard.set_text(St.ClipboardType.CLIPBOARD, stripped);
            });
        });
    }

    disable() {
        this._selection.disconnect(this._ownerChangedId);
        this._ownerChangedId = null;
        this._selection = null;
        this._clipboard = null;
        this._lastSet = null;
    }
}
