import type { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ResponsiveTooltipProps {
  children: ReactNode;
  content: ReactNode;
  className?: string;
}

export function ResponsiveTooltip({ children, content, className }: ResponsiveTooltipProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className={className ?? 'max-w-xs text-xs leading-relaxed'}>
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <TooltipProvider delayDuration={140}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className={className ?? 'max-w-xs text-xs leading-relaxed'}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
