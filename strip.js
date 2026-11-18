// Claude Code's reply bullet ("● " on Linux, "⏺ " on macOS) fills the first line's two-space margin.
const BULLET = /^[●⏺] /;

// Ptyxis appends the tab's foreground command to the title: "✳ <summary> — claude --resume <id>".
const CLAUDE_TITLE = / — claude(\s|$)/;

// Returns the text with two leading spaces removed from every line, or null when
// some non-blank line does not start with two spaces (or there is no non-blank line).
// skipFirstLine leaves the first line out of that check, for a selection that starts mid-line.
export function stripIndent(text, {bullet = true, skipFirstLine = false} = {}) {
    const lines = text.split('\n');
    if (bullet && BULLET.test(lines[0]))
        lines[0] = lines[0].replace(BULLET, '  ');
    const checked = skipFirstLine ? lines.slice(1) : lines;
    const content = checked.filter(line => line.trim() !== '');
    if (content.length === 0 || !content.every(line => line.startsWith('  ')))
        return null;
    return lines.map(line => line.replace(/^ {1,2}/, '')).join('\n');
}

export function isClaudeCode(title) {
    return CLAUDE_TITLE.test(title ?? '');
}

// Reads the extension's settings; a value outside a key's choices falls back to its default.
export function readOptions(settings) {
    return {
        terminals: new Set(settings.get_strv('terminals')),
        bullet: settings.get_string('bullet') !== 'disabled',
        claudeFirstLine: settings.get_string('first-line') !== 'strict',
    };
}
