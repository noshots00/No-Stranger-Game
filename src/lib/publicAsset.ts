/** Files under `public/` — prefix with Vite `BASE_URL` so assets work on subpath deploys. */
export function publicAsset(pathFromPublicRoot: string): string {
  const base = import.meta.env.BASE_URL;
  const path = pathFromPublicRoot.replace(/^\/+/, '');
  return `${base}${path}`;
}
