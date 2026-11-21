/**
 * test/config-types.test.ts
 * -------------------------
 *
 * Type-level tests for `WaveformBarConfig`. This hand-written type is the
 * contract this package ships (its `.d.ts` doesn't depend on the bar's,
 * an optional peer) — and `config` goes to `window.WaveformBar.init()`
 * verbatim, so a key that's wrong here is wrong for every user even
 * though it works at runtime. The 2.0 bar generates its own types, so the
 * last block checks this one against them.
 *
 * `expectTypeOf` is a no-op under `vitest run`; these assertions are
 * enforced by the typecheck (`test/` is in tsconfig `include`).
 *
 * Kept identical across the four bar wrappers (astro / react / svelte /
 * vue) apart from the import path.
 */
import { describe, expectTypeOf, it } from 'vitest';
import type { WaveformBarConfig, WaveformBarTrackData } from '../../src/bar/types';
import type {
	WaveformBarConfig as CoreBarConfig,
	WaveformBarTrack as CoreBarTrack,
} from '@arraypress/waveform-bar';

describe('WaveformBarConfig — types match what the bar forwards to the player', () => {
	it('accepts waveformGradient with the core player\'s axis union', () => {
		// waveform-player index.d.ts: 'vertical' | 'horizontal' | 'diagonal'.
		expectTypeOf<WaveformBarConfig['waveformGradient']>().toEqualTypeOf<
			'vertical' | 'horizontal' | 'diagonal' | undefined
		>();
	});

	it('accepts gradient stop arrays for waveformColor / progressColor', () => {
		// The bar forwards these verbatim; the player takes string | string[] | null.
		expectTypeOf<WaveformBarConfig['waveformColor']>().toEqualTypeOf<
			string | string[] | null | undefined
		>();
		expectTypeOf<WaveformBarConfig['progressColor']>().toEqualTypeOf<
			string | string[] | null | undefined
		>();
	});

	it('accepts barRadius as a number (0 = square) or null (player default)', () => {
		expectTypeOf<WaveformBarConfig['barRadius']>().toEqualTypeOf<number | null | undefined>();
	});

	it('still accepts showTime', () => {
		expectTypeOf<WaveformBarConfig['showTime']>().toEqualTypeOf<boolean | undefined>();
	});
});

describe('WaveformBarConfig — against the 2.0 bar\'s generated types', () => {
	it('every key has the core\'s type (or a narrower one)', () => {
		type Shared = keyof WaveformBarConfig & keyof CoreBarConfig;
		expectTypeOf<Exclude<keyof WaveformBarConfig, keyof CoreBarConfig>>().toEqualTypeOf<never>();
		expectTypeOf<Pick<WaveformBarConfig, Exclude<Shared, 'actions'>>>().toExtend<
			Pick<CoreBarConfig, Exclude<Shared, 'actions'>>
		>();
	});

	it('types a track duration as seconds or a clock string, and peaks as an array or string (wp1:)', () => {
		expectTypeOf<WaveformBarTrackData['duration']>().toEqualTypeOf<string | number | undefined>();
		expectTypeOf<WaveformBarTrackData['duration']>().toExtend<CoreBarTrack['duration']>();
		expectTypeOf<WaveformBarTrackData['waveform']>().toEqualTypeOf<number[] | string | undefined>();
		expectTypeOf<WaveformBarTrackData['waveform']>().toExtend<CoreBarTrack['waveform']>();
	});
});
