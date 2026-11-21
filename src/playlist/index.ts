/**
 * @module @arraypress/waveform-vue/playlist
 * @description
 * Public entry point for the Vue 3 wrapper around
 * `@arraypress/waveform-playlist`.
 *
 * ```vue
 * <script setup lang="ts">
 * import { WaveformPlaylist } from '@arraypress/waveform-vue/playlist';
 *
 * const tracks = [
 *   { url: '/audio/a.mp3', title: 'Track A' },
 *   { url: '/audio/b.mp3', title: 'Track B' },
 * ];
 * </script>
 *
 * <template>
 *   <WaveformPlaylist :tracks="tracks" />
 * </template>
 * ```
 *
 * ## Types
 *
 * ```ts
 * import type {
 *   WaveformPlaylistProps,
 *   WaveformPlaylistLayoutProps,
 *   WaveformPlaylistExpose,
 *   WaveformPlaylistTrackInput,
 *   WaveformPlaylistChapterInput,
 *   WaveformPlaylistOptions,
 *   WaveformPlaylistTrack,
 *   WaveformPlaylistChapter,
 *   WaveformPlaylistMarker,
 *   WaveformStyle,
 *   WaveformMarker,
 *   WaveformPeaks,
 *   ColorPreset,
 *   AudioMode,
 *   AudioPreload,
 *   ButtonAlign,
 * } from '@arraypress/waveform-vue/playlist';
 * ```
 */

export { WaveformPlaylist, default } from './WaveformPlaylist';

export type {
	WaveformPlaylistProps,
	WaveformPlaylistLayoutProps,
	WaveformPlaylistExpose,
	WaveformPlaylistTrackInput,
	WaveformPlaylistChapterInput,
	WaveformPlaylistOptions,
	WaveformPlaylistTrack,
	WaveformPlaylistChapter,
	WaveformPlaylistMarker,
	WaveformStyle,
	WaveformMarker,
	WaveformPeaks,
	ColorPreset,
	AudioMode,
	AudioPreload,
	ButtonAlign,
} from './types';
