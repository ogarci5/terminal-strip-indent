// Claude Code's reply bullet ("● " on Linux, "⏺ " on macOS) fills the first line's two-space margin.
const BULLET = /^[●⏺] /;

// Returns the text with two leading spaces removed from every line, or null when
// some non-blank line does not start with two spaces (or there is no non-blank line).
export function stripIndent(text) {
    const lines = text.split('\n');
    if (BULLET.test(lines[0]))
        lines[0] = lines[0].replace(BULLET, '  ');
    const content = lines.filter(line => line.trim() !== '');
    if (content.length === 0 || !content.every(line => line.startsWith('  ')))
        return null;
    return lines.map(line => line.replace(/^ {1,2}/, '')).join('\n');
}
