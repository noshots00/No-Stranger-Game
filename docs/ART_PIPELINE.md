# Art pipeline (standardized exports)

Use this when you have **mixed-size masters** (phone shots, AI squares, etc.) and want **one consistent game-ready format** without hand-editing each file in Photoshop.

## What “standardized” means here

| Rule | Default | Why |
|------|---------|-----|
| **Fit inside a max box** | 800×1064 px | Matches a **2×** “card” slot if your UI shows ~400×532 CSS px; keeps one asset per illustration instead of 1×/2× pairs. |
| **Aspect ratio** | **Preserved** (no crop, no stretch) | The whole image stays visible; output width/height vary (e.g. 800×800 vs 800×1000). |
| **Smaller sources** | **Not enlarged** (`>` in resize) | Avoids blur from upscaling. |
| **Format** | **WebP** | Small download; broad support. |
| **Quality** | **82** | Good balance; raise if you see banding on gradients. |
| **Metadata** | **Stripped** | Fewer bytes; no accidental EXIF location data. |
| **Orientation** | **Auto** | EXIF rotation applied before resize (phone photos). |

You can change max box and quality in one place: [scripts/batch-art.ps1](../scripts/batch-art.ps1).

## What ImageMagick does *not* do automatically

- **Feathered edges / oval vignettes / artistic masks** — needs masks or manual prep; not part of this batch.
- **Fixing bad composition** — crop in an editor first if needed.

The batch script keeps things **economical and predictable**; “attractive” is mostly **consistent sizing + sharp WebP**, optional light sharpening after downscale.

## Workflow

1. Drop originals anywhere you like (recommended: `public/art/To be converted/` — optional to gitignore).
2. Install ImageMagick once (`magick` on PATH). On Windows: `winget install ImageMagick.ImageMagick`.
3. From repo root, run either:

   ```powershell
   .\scripts\batch-art.ps1
   ```

   or with npm:

   ```bash
   npm run art:batch
   ```

4. Outputs land in `public/art/converted/` as `*.webp` (same base name as the source).

### Override paths or box size

```powershell
.\scripts\batch-art.ps1 -SourceDir "public\art\To be converted" -DestDir "public\art\converted" -MaxWidth 400 -MaxHeight 532 -Quality 82
```

### Optional sharpening (after downscale)

```powershell
.\scripts\batch-art.ps1 -Sharpen
```

Light unsharp helps perceived clarity on downscaled photos; turn off for painterly art if it looks crunchy.

## Git strategy

- **Commit** optimized WebPs under `public/…` when they are referenced by the game.
- **Optional:** add `public/art/To be converted/` to `.gitignore` so huge masters never hit the repo — keep only exports.

## Related

- In-game paths use Vite `BASE_URL`; reference assets with `publicAsset('…')` or paths under `public/`.
