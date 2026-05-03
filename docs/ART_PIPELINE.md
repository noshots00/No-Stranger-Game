# Art pipeline (standardized exports)

Use this when you have **mixed-size masters** (phone shots, AI squares, etc.) and want **one consistent game-ready format** without hand-editing each file.

The pipeline produces vivid, soft-edged "card" images: shrunk to fit a max box, color-popped, sharpened, given rounded corners, and faded to transparent at the edges.

## What "standardized" means here

| Rule | Default | Why |
|------|---------|-----|
| **Fit inside a max box** | 800x1064 px | Matches a 2x "card" slot for ~400x532 CSS px UI; one asset per illustration. |
| **Aspect ratio** | Preserved (no crop, no stretch) | The whole image stays visible; output dims vary per source. |
| **Smaller sources** | Not enlarged (`>` in resize) | Avoids upscaling blur. |
| **Color profile** | Forced to sRGB | Consistent appearance across browsers / monitors. |
| **Auto-trim** | Solid borders cut before resize | AI tools often pad with white; this removes wasted area. |
| **Auto white-balance** | `-auto-gamma` | Lifts washed-out exposures; subtle. |
| **Saturation** | +30% (`-modulate 100,130,100`) | "Strong pop" — colors clearly more vivid. |
| **Contrast** | Sigmoidal S-curve (`4,50%`) | Punchy midtones, deeper shadows, brighter highlights. |
| **Sharpen** | Subtle unsharp | Recovers detail lost during downscale. |
| **Rounded corners** | 18px | Soft "card" silhouette; no harsh 90-degree corners. |
| **Edge fade** | Rectangular feather, ~1% of shorter side (default), fades to transparent | Soft edge without eating the frame; tune `-FeatherPercent`. |
| **Format** | WebP (alpha-supporting) | Small files, broad browser support, transparency. |
| **Quality** | 82 | Good balance; raise if you see banding on gradients. |
| **Metadata** | Stripped | Fewer bytes, no accidental EXIF location data. |
| **Filenames** | kebab-case | `GnomesGathered.jpg` -> `gnomes-gathered.webp` for clean URLs. |

You can change defaults from the command line; see **Tuning** below.

## What ImageMagick does NOT do automatically

- Composition fixes (bad crops, awkward poses) — fix in an editor first.
- Custom artistic masks (oval vignettes, painterly edges) — out of scope for the batch.

## Run output (per batch)

Each invocation uses one timestamp like `2026-05-02_20-37-15`:

- **Outputs**: `public/art/converted/Batch <stamp>/<kebab-name>.webp`
- **Moved sources**: `public/art/Processed <stamp>/<original-name>.<ext>`
- **Drop zone** `public/art/To be converted/` ends each run **empty** (only successful files are moved).

If a single file fails, it stays in `To be converted/` for retry; the script logs a warning and continues with the rest.

## Workflow

1. Drop originals into `public/art/To be converted/`.
2. From the repo root, run:
   ```bash
   npm run art:batch
   ```
3. Inspect outputs in `public/art/converted/Batch <stamp>/`.
4. Drop the moved sources from `public/art/Processed <stamp>/` into cloud backup if you want to keep them; otherwise delete.

### Override defaults

```powershell
.\scripts\batch-art.ps1 `
  -MaxWidth 600 -MaxHeight 800 `
  -Saturation 115 `
  -CornerRadius 24 -FeatherPercent 15 `
  -Quality 88
```

## Tuning

| Flag | Default | Meaning |
|------|---------|---------|
| `-SourceDir` | `public\art\To be converted` | Folder to read images from. |
| `-ConvertedRoot` | `public\art\converted` | Parent folder for `Batch <stamp>/`. |
| `-ProcessedRoot` | `public\art\Processed` | Parent name for moved sources (script appends ` <stamp>`). |
| `-MaxWidth` / `-MaxHeight` | `800` / `1064` | Fit-inside-box dimensions. |
| `-Quality` | `82` | WebP quality 1-100. |
| `-Saturation` | `130` | `-modulate` saturation multiplier (100 = unchanged). |
| `-SigmoidalContrast` | `'4,50%'` | S-curve contrast; first number is strength, second is midpoint. Pass `''` to disable. |
| `-CornerRadius` | `18` | Rounded corner radius (px). |
| `-FeatherPercent` | `1` | Edge fade width as % of shorter side (88% gentler than former default `10`). |
| `-AutoGamma` | `$true` | Auto white-balance. |
| `-Sharpen` | `$true` | Subtle unsharp after resize. |
| `-Kebab` | `$true` | Kebab-case output filenames. |
| `-ForceSrgb` | `$true` | Force sRGB color profile. |
| `-TrimBorders` | `$true` | Auto-trim solid borders before resize. |

## Git strategy

- **Commit** optimized WebPs from `public/art/converted/Batch */` only when they are referenced by the game.
- **Optional**: add `public/art/To be converted/` and `public/art/Processed*/` to `.gitignore` so heavy masters never hit the repo. Only the chosen exports under `converted/` need to ship.

## Related

- In-game paths use Vite `BASE_URL`; reference assets with `publicAsset('...')` or paths under `public/`.
- Install ImageMagick on Windows: `winget install ImageMagick.ImageMagick` (restart the terminal afterwards).
