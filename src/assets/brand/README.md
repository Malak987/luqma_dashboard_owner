# Luqma brand assets

Supplied by the project owner and copied into the workspace unchanged. The only derived files are the `-480` PNGs, which are proportional downscales used for display; the originals are kept for provenance.

## Source files and SHA-256

| File | SHA-256 |
|---|---|
| `luqma-logo-on-dark.png` (original scale) | `91f37d84c75236f97c7ae5ec2cc2d320014798eed5b7ce5df7ed3343e5ec432a` |
| `luqma-logo-on-light.png` (original scale) | `312cc4707bb23a3d72d10fa890bac920c5b03d2fc256a8758564c6e9e3a5e03f` |
| `lottie/luqma-logo-dark-original.json` | `81f4e8702193ad9108f02d52e8344d442f6b1417a8b628e2de4473528252d6c9` |
| `lottie/luqma-logo-dark.json` | `c73b0e27e9f96a130903d4cda2bd36075278e628ee4ac0e88a4d2e154f7e0b4a` |
| `lottie/luqma-logo-light-original.json` | `c35a8a053736ad6370960bfcff2aa95735c3c78cb0e93f124d31a96eb3240ebf` |
| `lottie/luqma-logo-light.json` | `fa1cc716626cfc813ffd9de8e649d8c840f822827947fbfacacb51016ec9c8ba` |

## Usage

- **Sidebar and mobile login:** `luqma-logo-on-light-480.png` / `luqma-logo-on-dark-480.png`.
  - 480×307 px proportional derivatives of the originals, created with a Lanczos downscale. No recoloring, cropping of the mark, or redrawing.
- **Desktop login:** `lottie/luqma-logo-light.json` in light theme and `lottie/luqma-logo-dark.json` in dark theme.
  - The 4.4 s variants are used; the `-original` 4 s exports are retained but not bundled.
  - The Lottie player and JSON are lazy-loaded only on desktop (≥900 px) when reduced motion is not requested. A static logo is shown in every fallback case.
- **Maroon brand panel:** the dark (cream/gold) logo is used regardless of theme, because the panel background is dark.

No official asset was altered in color, geometry, or composition.
