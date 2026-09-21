import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Packaging checks, not a substitute for behavioral testing in either agent host.
const root = fileURLToPath(new URL('../skills/decision-circuit-engineering/', import.meta.url));
const expected = ['LICENSE', 'README.md', 'SKILL.md', 'agents/openai.yaml', 'assets/decision-brief.md',
  'references/jev.md', 'references/milk-parlour.md', 'references/runtime-contracts.md'];
const walk = directory => readdirSync(directory).flatMap(name => {
  const path = resolve(directory, name);
  assert.equal(lstatSync(path).isSymbolicLink(), false, `Packaged symlink: ${path}`);
  return lstatSync(path).isDirectory() ? walk(path) : [relative(root, path).split(sep).join('/')];
});

test('portable decision skill contains only its intended distributable files', () => {
  assert.deepEqual(walk(root).sort(), [...expected].sort());
});

test('all local skill references resolve inside the portable package', () => {
  for (const file of expected.filter(file => file.endsWith('.md'))) {
    const text = readFileSync(resolve(root, file), 'utf8');
    for (const [, href] of text.matchAll(/\]\(([^)]+)\)/g)) {
      if (/^https:\/\//.test(href)) continue;
      const target = resolve(dirname(resolve(root, file)), href.split('#')[0]);
      const rel = relative(root, target);
      assert.ok(rel !== '..' && !rel.startsWith(`..${sep}`), `${file} escapes package: ${href}`);
      assert.ok(existsSync(target), `${file} broken reference: ${href}`);
    }
  }
});

test('skill distribution contains no machine paths, embedded keys or executable hooks', () => {
  for (const file of expected) {
    const text = readFileSync(resolve(root, file), 'utf8');
    assert.doesNotMatch(text, /\/Users\/|\/home\/\w|apikey_[a-z0-9_]+|sk-[a-zA-Z0-9]{16,}/);
    assert.doesNotMatch(text, /^\s*(?:allowed-tools|hooks|context|model):/m);
    assert.doesNotMatch(text, /^\s*!`/m);
  }
});
