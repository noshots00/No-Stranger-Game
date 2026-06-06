/** Prefix public-folder paths with Vite base (required on GitHub Pages subpaths). */
export function publicAsset(path: string): string {
  const base = import.meta.env.BASE_URL;
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${normalized}`;
}
