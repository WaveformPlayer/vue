/**
 * test/peer-ranges.test.ts
 * ------------------------
 *
 * The peer floors are load-bearing, not cosmetic. This sub-path targets
 * `@arraypress/waveform-playlist` 2.0: the release that strips `loop`,
 * `showLoop` and `lazy`, hands each track's `data-duration` /
 * `data-download-url` / `data-download-name` to its player, and needs
 * `@arraypress/waveform-player` 2.0 (whose options this forwards).
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
	it('requires waveform-playlist >= 2.0.0 (per-track duration / download, the options it strips)', () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-playlist'], '2.0.0')).toBe(true);
	});

	it("requires waveform-player >= 2.0.0 (the playlist core's own floor, and the forwarded 2.0 options)", () => {
		expect(atLeast(pkg.peerDependencies['@arraypress/waveform-player'], '2.0.0')).toBe(true);
	});

	it('develops against the sibling 2.0 checkouts until they are published', () => {
		expect(pkg.devDependencies['@arraypress/waveform-playlist']).toBe('file:../waveform-playlist');
		expect(pkg.devDependencies['@arraypress/waveform-player']).toBe('file:../waveform-player');
	});
});
