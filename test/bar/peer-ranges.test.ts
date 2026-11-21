/**
 * test/peer-ranges.test.ts
 * ------------------------
 *
 * The peer floors must cover everything the wrapper types and relies on:
 *
 *   - `@arraypress/waveform-bar` ≥ 2.0.0 — the release that passes a
 *     trigger's `duration` (seconds or a clock string) and `wp1:` peaks to
 *     the player, as `WaveformBarTrackData` documents, and the first with
 *     `barRadius` and `showTime: false` in every supported release.
 *   - `@arraypress/waveform-player` ≥ 2.0.0 — the 2.0 bar's own peer.
 *
 * Dev dependencies are the sibling 2.0 checkouts (`file:`) until 2.0 is
 * on npm, so the tests run against exactly what will ship.
 */
import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';

const MIN_FLOORS: Record<string, string> = {
	'@arraypress/waveform-bar': '2.0.0',
	'@arraypress/waveform-player': '2.0.0',
};

/** Lower bound of a `^x.y.z` range as a comparable tuple. */
function caretFloor(range: string): [number, number, number] {
	const m = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range);
	if (!m) throw new Error(`expected a ^x.y.z range, got "${range}"`);
	return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function atLeast(range: string, min: string): boolean {
	const a = caretFloor(range);
	const b = min.split('.').map(Number);
	for (let i = 0; i < 3; i++) {
		if (a[i] !== b[i]) return a[i] > b[i];
	}
	return true;
}

const deps: Record<string, Record<string, string> | undefined> = {
	peerDependencies: pkg.peerDependencies,
	devDependencies: pkg.devDependencies,
};

describe('package.json — peer floors cover what the wrapper relies on', () => {
	for (const [name, min] of Object.entries(MIN_FLOORS)) {
		it(`peerDependencies["${name}"] is at least ^${min}`, () => {
			const range = deps.peerDependencies?.[name];
			expect(range, `${name} must be a peer`).toBeDefined();
			expect(atLeast(range!, min), `${name}@${range} < ${min}`).toBe(true);
		});

		it(`devDependencies["${name}"] is the sibling 2.0 checkout`, () => {
			const dir = name.replace('@arraypress/', '');
			expect(deps.devDependencies?.[name]).toBe(`file:../${dir}`);
		});
	}
});
