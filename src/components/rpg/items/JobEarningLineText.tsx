import { Fragment } from 'react';
import { formatResourceLabel } from '../helpers';
import { ItemName } from './ItemName';

/** Match earning banner lines like `7-12 stone/day`. */
const RESOURCE_EARNING_LINE = /^(\d+(?:-\d+)?)\s+(.+)\/day$/;

const RESOURCE_KEYS = ['stone', 'iron', 'logs', 'copperOre', 'adventures'] as const;

function displayResourceLabelFromEarningToken(token: string): string {
  const normalized = token.trim().toLowerCase();
  for (const key of RESOURCE_KEYS) {
    if (formatResourceLabel(key).toLowerCase() === normalized) {
      return formatResourceLabel(key);
    }
  }
  return token;
}

export function JobEarningLineText({ line }: { line: string }) {
  const match = RESOURCE_EARNING_LINE.exec(line.trim());
  if (!match) return <>{line}</>;

  const amount = match[1];
  const resourceLabel = displayResourceLabelFromEarningToken(match[2]);

  return (
    <>
      {amount} <ItemName label={resourceLabel} category="material" />/day
    </>
  );
}

export function JobEarningSummary({ lines }: { lines: readonly string[] }) {
  if (lines.length === 0) return null;
  return (
    <>
      {lines.map((line, index) => (
        <Fragment key={`${line}-${index}`}>
          {index > 0 ? ' · ' : null}
          <JobEarningLineText line={line} />
        </Fragment>
      ))}
    </>
  );
}
