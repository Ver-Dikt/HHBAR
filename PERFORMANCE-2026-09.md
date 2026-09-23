# HHBAR performance pass — 2026-09-23

## Summary

The existing design, sections, music library, video background, gallery, and RestoPlace booking flow remain in place. Oversized photographs and the hero video were recompressed, and hidden menu photos no longer all load on entry.

## Measured asset changes

| Asset group | Before | After | Method |
| --- | ---: | ---: | --- |
| `img/` | 185.7 MiB | 24.9 MiB | Pillow JPEG/PNG recompression, bounded display dimensions, unchanged URLs |
| `Video/hero-video.mp4` | 24.8 MiB | 6.15 MiB | H.264/AAC, same duration and 1920×1080 frame size, fast-start MP4 |

Audio files were not modified. The original media remains recoverable from Git history.

## Runtime changes

- Menu photo integrity checks now run when an item approaches the viewport, instead of issuing requests for all hidden categories at startup. Switching categories still loads their photos.
- Hero logo and gallery images now declare intrinsic dimensions; gallery images use async decoding. The hero logo receives high fetch priority.
- The service worker cache version was incremented for deployment, and cross-origin embeds/widgets are excluded from its cache path.

## Verification

- `npm run check`: all six pages' local assets resolve.
- `npm test`: data validation/security tests pass.
- `npm run test:browser`: desktop/mobile navigation, menu, gallery, music, local-file opening, and table-specific RestoPlace handoff pass. The test also checks that hidden lemonade photos are not fetched at initial menu load and do fetch when that category is selected.
- Every optimized image and the transcoded video decode successfully.

## Limitations and next monitoring step

No production Core Web Vitals (LCP/INP/CLS), throttled Lighthouse score, or regional RUM data was available. The byte savings above are measured, not a guarantee of a particular loading time on every network. VK embeds and the RestoPlace widget are third-party services, so their latency is outside the static site's control. Measure the published site with mobile Lighthouse and field data after GitHub Pages deployment.
