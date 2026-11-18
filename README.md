# terminal-strip-indent

A GNOME Shell extension that removes the two-space margin from text you copy in a terminal.

When every non-blank line of a copy starts with two spaces, as with output copied from Claude Code, the extension removes those two spaces from each line in the clipboard. If any non-blank line does not start with two spaces, the copy is left unchanged. A Claude Code reply bullet (`● ` or `⏺ `) at the start of the first line counts as that line's two spaces, so a copy that starts at the bullet is cleaned too (this can be turned off, see [Settings](#settings)).

The terminal sets the clipboard first; GNOME Shell then reports the change and the extension replaces the text a few milliseconds later.

Requires GNOME Shell 45 to 50. Tested on Fedora 44 (GNOME Shell 50, Wayland) with Ptyxis.

## Installation

```bash
git clone https://github.com/ogarci5/terminal-strip-indent.git terminal-strip-indent
cd terminal-strip-indent
gnome-extensions pack --force --extra-source=strip.js -o /tmp
gnome-extensions install --force /tmp/terminal-strip-indent@local.shell-extension.zip
```

**Log out and log back in.** GNOME Shell only discovers a newly installed extension when it starts, and on Wayland it cannot be restarted in place. Suspending or locking the screen does not count. The same applies after an update: reinstall, then log out and back in, because disabling and enabling the extension does not reload its code.

After logging in, make sure user extensions are allowed, then enable the extension:

```bash
gsettings get org.gnome.shell disable-user-extensions    # must print false
gsettings set org.gnome.shell disable-user-extensions false
gnome-extensions enable terminal-strip-indent@local
gnome-extensions info terminal-strip-indent@local        # Enabled: Yes, State: ACTIVE
```

`disable-user-extensions` set to `true` switches off every user-installed extension, and `gnome-extensions enable` then has no effect (`info` shows `Enabled: No`, `State: INITIALIZED`). Setting it to `false` also turns back on any other extensions you had enabled.

## What it affects

By default the extension only acts when the focused window is one of these terminals (the `terminals` setting):

| Terminal | Window class |
|---|---|
| Ptyxis | `org.gnome.Ptyxis`, `org.gnome.Ptyxis.Devel` |
| GNOME Terminal | `org.gnome.Terminal` |
| GNOME Console | `org.gnome.Console` |
| kitty | `kitty` |
| Alacritty | `Alacritty` |
| WezTerm | `org.wezfurlong.wezterm` |
| Ghostty | `com.mitchellh.ghostty` |
| foot | `foot` |

- **Browsers and IDEs are not affected.** Copies from Firefox, Chrome or VS Code (including its integrated terminal, which is part of the VS Code window) are left as they are.
- **Only the clipboard is changed**: Ctrl+Shift+C, right-click Copy, or a program in the terminal setting the clipboard. Select-to-copy and middle-click paste use the primary selection, which is never touched.
- **Known side effect:** `systemctl status` output starts with `● ` and its other lines are indented, so a copy of it loses the bullet and two spaces per line. Setting `bullet` to `disabled` leaves it unchanged.

If copies are not being stripped, check the shell log while copying:

```bash
journalctl -f -o cat /usr/bin/gnome-shell
```

## Settings

Both settings are read on every copy, so a change applies to the next copy without logging out.

```bash
# Terminals the extension acts in. Writing the key replaces the whole list.
dconf write /org/gnome/shell/extensions/terminal-strip-indent/terminals "['org.gnome.Ptyxis', 'kitty', 'code']"
dconf read /org/gnome/shell/extensions/terminal-strip-indent/terminals
dconf reset /org/gnome/shell/extensions/terminal-strip-indent/terminals    # back to the default list

# Treat a Claude Code bullet on the first line as its two spaces: 'enabled' (default) or 'disabled'.
dconf write /org/gnome/shell/extensions/terminal-strip-indent/bullet "'disabled'"
dconf reset /org/gnome/shell/extensions/terminal-strip-indent/bullet
```

The inner single quotes are required; dconf values are written as GVariant text. `dconf read` printing nothing means the default is in effect. A `bullet` value other than `enabled` or `disabled` is ignored and the default is used. To find a program's window class, open Looking Glass (Alt+F2, `lg`) and look at the Windows tab.

## Testing

```bash
gjs -m test_strip.js
```
