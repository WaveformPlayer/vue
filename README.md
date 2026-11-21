# WaveformPlayer for Vue

Vue 3 components for the WaveformPlayer family: the player, the persistent
bar, the playlist and the sound list. Each core has its own sub-path, so
you install only the cores you use.

| Import from | Components | Install with it |
| --- | --- | --- |
| `@arraypress/waveform-vue/player` | `WaveformPlayer` | `@arraypress/waveform-player` |
| `@arraypress/waveform-vue/bar` | `WaveformBar`, `WaveformBarTrigger` | `@arraypress/waveform-bar`, `@arraypress/waveform-player` |
| `@arraypress/waveform-vue/playlist` | `WaveformPlaylist` | `@arraypress/waveform-playlist`, `@arraypress/waveform-player` |
| `@arraypress/waveform-vue/sounds` | `WaveformSounds` | `@arraypress/waveform-sounds`, `@arraypress/waveform-player` |

There is no root import: `import … from '@arraypress/waveform-vue'` does not
resolve. Each sub-path loads its core lazily with `import()`, and bundlers
resolve every `import()` at build time, so a single entry for all four would
fail to build for anyone who hasn't installed every core. The cores are
optional peer dependencies: `^2.0.0` for `-player` and `-bar`, `^2.1.0` for
`-playlist` and `-sounds`; `vue` 3.5+ is required. The package
is ES modules only and needs Node 22.12+ to build with.

Each sub-path exports the same components, props, emits, exposed API and
types as the package it replaces (`@arraypress/waveform-player-vue`,
`-bar-vue`, `-playlist-vue` and `-sounds-vue`), plus the 2.0 additions in
the [CHANGELOG](./CHANGELOG.md). Switching is a change of import path.

## Player

```bash
npm install @arraypress/waveform-vue @arraypress/waveform-player vue
```

```vue
<script setup lang="ts">
import { WaveformPlayer } from '@arraypress/waveform-vue/player';
import '@arraypress/waveform-player/dist/waveform-player.css';
</script>

<template>
  <WaveformPlayer :url="'/track.mp3'" title="My Song" artist="The Artist" />
</template>
```

With a known length and compact peaks, a `preload: 'none'` player shows the
total time and the waveform without fetching any audio until play:

```vue
<WaveformPlayer
  url="/track.mp3"
  preload="none"
  :duration="187"
  waveform="wp1:…"
  show-volume
  show-download
  @seek="(d) => console.log(d.currentTime)"
  @volumechange="(d) => console.log(d.volume, d.muted)"
/>
```

## Bar

```bash
npm install @arraypress/waveform-vue @arraypress/waveform-bar @arraypress/waveform-player vue
```

```vue
<script setup lang="ts">
import { WaveformBar, WaveformBarTrigger } from '@arraypress/waveform-vue/bar';
</script>

<template>
  <!-- render ONCE in your root layout -->
  <WaveformBar :config="{ persist: true, continuous: true }" />

  <!-- drop triggers anywhere -->
  <WaveformBarTrigger url="/audio/track.mp3" title="My Track" artist="The Artist" />
</template>
```

## Playlist

```bash
npm install @arraypress/waveform-vue @arraypress/waveform-playlist @arraypress/waveform-player vue
```

```vue
<script setup lang="ts">
import { WaveformPlaylist } from '@arraypress/waveform-vue/playlist';
</script>

<template>
  <WaveformPlaylist :tracks="[{ url: '/a.mp3', title: 'A', artist: 'Artist' }]" />
</template>
```

## Sounds

```bash
npm install @arraypress/waveform-vue @arraypress/waveform-sounds @arraypress/waveform-player vue
```

Once, at your app entry:

```ts
import '@arraypress/waveform-player'; // the audio engine (registers window.WaveformPlayer)
import '@arraypress/waveform-player/styles.css';
import '@arraypress/waveform-sounds/styles.css';
```

```vue
<script setup lang="ts">
import { WaveformSounds } from '@arraypress/waveform-vue/sounds';
</script>

<template>
  <WaveformSounds manifest="/sounds.json" @play="(sound) => console.log(sound.title)" />
</template>
```

## Documentation

Props, events, the imperative API and SSR notes for all four components:
[docs.waveformplayer.com/frameworks/vue](https://docs.waveformplayer.com/frameworks/vue/).

## License

MIT © 2026 ArrayPress Limited
