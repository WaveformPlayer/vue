/**
 * test/peer-ranges.test.ts
 * ------------------------
 *
 * The peer floors are load-bearing, not cosmetic. This sub-path targets
 * `@arraypress/waveform-playlist` 2.0: the release that strips `loop`,
 * `showLoop` and `lazy`, hands each track's `data-duration` /
 * `data-download-url` / `data-download-name` to its player, and needs
 * `@arraypress/waveform-player` 2.0 (whose options this forwards); the
 * component imports `/no-autoinit`, which playlist 2.1.0 added (2.1's root
 * scans the page and registers `<waveform-playlist>` on import).
 * Earlier floors (1.8.0, which first honoured the constructor options and
 * callbacks) are subsumed.
 */
import { describe, it, expect } from 'vitest';
import pkg from '../../package.json';

/** The lowest version a `^x.y.z` range admits, as comparable numbers. */
const floor = (range: string): number[] => {
	const m = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range);
	if (!m) throw new Error(`expected a ^x.y.z range, got ${range}`);
	return m.slice(1).map(Number);
};
const atLeast = (range: string, min: string): boolean => {
	const [a, b] = [floor(range), floor(`^${min}`)];
	for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
	return true;
};

describe('peer dependency floors', () => {
	it('requires waveform-playlist >= 2.1.0 (the /no-autoinit entry)', () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-playlist'], '2.1.0')).toBe(true);
	});

	it("requires waveform-player >= 2.0.0 (the playlist core's own floor, and the forwarded 2.0 options)", () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-player'], '2.0.0')).toBe(true);
	});

	it('develops against the published 2.0 packages (a ^2.x devDependency at least the peer floor)', () => {
		for (const [name, min] of [
			['@arraypress/waveform-playlist', '2.1.0'],
			['@arraypress/waveform-player', '2.0.0'],
		] as const) {
			const range = pkg.devDependencies[name];
			expect(floor(range)[0], `${name}@${range} is not a ^2.x range`).toBe(2);
			expect(atLeast(range, min), `${name}@${range} < ${min}`).toBe(true);
		}
	});
});
