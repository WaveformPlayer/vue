/**
 * test/option-surface.ts
 * ----------------------
 *
 * The option surface this wrapper has to cover, read from the two cores'
 * generated `types/types.d.ts` files (2.0; the hand-written root
 * `index.d.ts` they replaced is gone) as installed in `node_modules`:
 *
 *   - every key of the playlist core's `WaveformPlaylistOptions`, and
 *   - every key of the player core's `WaveformPlayerOptions` (the playlist
 *     passes unknown options through to its embedded player).
 *
 * The forwarding-drift test checks each key is either forwarded at runtime
 * or listed in its `NOT_FORWARDED` map with a reason, so a core option the
 * wrapper hasn't wired up fails a test instead of typechecking and being
 * silently dropped.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

/**
 * A file from an installed core, as text. Read from disk next to the core's
 * `package.json` (which both export) because neither exports its `types/`
 * directory — and from the real path, since a `file:` devDependency is a
 * symlink to a sibling repo that Vite's `?raw` would refuse to serve.
 */
const coreFile = (pkg: string, file: string): string =>
	readFileSync(new URL(file, `file://${createRequire(import.meta.url).resolve(`${pkg}/package.json`)}`), 'utf8');

const playerDts = coreFile('@arraypress/waveform-player', 'types/types.d.ts');
const playlistDts = coreFile('@arraypress/waveform-playlist', 'types/types.d.ts');

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

/** Every `WaveformPlayerOptions` key the installed player core declares. */
export const PLAYER_OPTIONS = interfaceKeys(playerDts, 'WaveformPlayerOptions');

/** Every playlist-own option the installed playlist core declares. */
export const PLAYLIST_OPTIONS = interfaceKeys(playlistDts, 'WaveformPlaylistOptions');

/** The whole surface: playlist-own options plus forwarded player options. */
export const ALL_OPTIONS = [...new Set([...PLAYLIST_OPTIONS, ...PLAYER_OPTIONS])];

/** Core callback options (`onPlay`, `onTimeUpdate`, …). */
export const isCallback = (key: string): boolean => /^on[A-Z]/.test(key);
