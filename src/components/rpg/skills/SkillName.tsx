import { cn } from '@/lib/utils';
import { skillNameClassName, skillNameColorStyle } from './skillDisplay';

export type SkillNameProps = {
  label: string;
  className?: string;
};

export function SkillName({ label, className }: SkillNameProps) {
  return (
    <span className={cn(skillNameClassName(), className)} style={skillNameColorStyle()}>
      {label}
    </span>
  );
}
