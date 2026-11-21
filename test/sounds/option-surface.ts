/**
 * test/option-surface.ts
 * ----------------------
 *
 * The option surface this wrapper has to cover: every key of the core's
 * `WaveformSoundsOptions`, read from its generated `types/types.d.ts` as
 * installed in `node_modules`.
 *
 * The forwarding-drift test checks each key is either forwarded at runtime
 * or listed in its `NOT_FORWARDED` map with a reason, so a core option the
 * wrapper hasn't wired up fails a test instead of typechecking and being
 * silently dropped.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

/**
 * The installed core's option types, as text: 2.0 generates them into
 * `types/types.d.ts` (the hand-written root `index.d.ts` is gone). Read from
 * disk next to the core's `package.json` because its `exports` map doesn't
 * expose `types/` — which also works for a temporary `file:` devDependency,
 * a symlink outside the repo that Vite's `?raw` would refuse to serve.
 */
const soundsDts = readFileSync(
	new URL('types/types.d.ts', `file://${createRequire(import.meta.url).resolve('@arraypress/waveform-sounds/package.json')}`),
	'utf8'
);

/**
 * The property names declared directly on `export interface <name>` —
 * comments stripped, nested `{…}` / `(…)` collapsed so parameter names and
 * inline object members don't count, index signatures skipped.
 */
export function interfaceKeys(dts: string, name: string): string[] {
	const start = dts.indexOf(`export interface ${name}`);
	if (start < 0) throw new Error(`interface ${name} not found`);
	const open = dts.indexOf('{', start);
	let depth = 0;
	let end = open;
	for (; end < dts.length; end++) {
		if (dts[end] === '{') depth++;
		else if (dts[end] === '}' && --depth === 0) break;
	}

	let body = dts
		.slice(open + 1, end)
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/\/\/.*$/gm, '');
	let previous: string;
	do {
		previous = body;
		body = body.replace(/\{[^{}]*\}/g, '{}').replace(/\([^()]*\)/g, '()');
	} while (body !== previous);

	return [...body.matchAll(/(?:^|[;\n])\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\??\s*:/g)].map(
		(m) => m[1]
	);
}

/** Every `WaveformSoundsOptions` key the installed core declares. */
export const ALL_OPTIONS = interfaceKeys(soundsDts, 'WaveformSoundsOptions');

/** Core callback options (`onPlay`, `onFilter`, …). */
export const isCallback = (key: string): boolean => /^on[A-Z]/.test(key);
