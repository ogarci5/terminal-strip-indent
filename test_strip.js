import {stripIndent} from './strip.js';
const cases = [
    ['  a\n  b', 'a\nb'],
    ['  a\n\n  b\n', 'a\n\nb\n'],
    ['  a\n \n  b', 'a\n\nb'],
    ['    a\n    b', '  a\n  b'],
    ['  a\nb', null],
    [' a\n  b', null],
    ['a', null],
    ['\n\n', null],
    ['  ', null],
    ['\tx', null],
    // bullet on the first line
    ['● ┌─┐\n  │x│\n  └─┘\n', '┌─┐\n│x│\n└─┘\n'],
    ['⏺ a\n    b', 'a\n  b'],
    ['● a', 'a'],
    ['● a\nb', null],
    ['  ● a\n  b', '● a\nb'],
    ['a\n● b\n  c', null],
    ['●a\n  b', null],
];
let fail = 0;
for (const [input, want] of cases) {
    const got = stripIndent(input);
    const ok = got === want;
    if (!ok) fail++;
    print(`${ok ? 'ok  ' : 'FAIL'} ${JSON.stringify(input)} -> ${JSON.stringify(got)}`);
}
print(fail ? `${fail} failed` : 'all passed');
