/** Compare two dotted semver strings (`major.minor.patch`); ignores prerelease suffix on `a`/`b`. */
export function compareSemver(a: string, b: string): number {
  const coreA = a.trim().split(/[-+]/, 1)[0] ?? '';
  const coreB = b.trim().split(/[-+]/, 1)[0] ?? '';
  const pa = coreA.split('.').map((x) => parseInt(x, 10));
  const pb = coreB.split('.').map((x) => parseInt(x, 10));
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = Number.isFinite(pa[i]) ? pa[i]! : 0;
    const nb = Number.isFinite(pb[i]) ? pb[i]! : 0;
    if (na < nb) return -1;
    if (na > nb) return 1;
  }
  return 0;
}
