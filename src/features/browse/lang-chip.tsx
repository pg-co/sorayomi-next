import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LangChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-medium transition',
        active
          ? 'border border-primary/50 bg-primary/10 text-primary shadow-[0_0_14px_-5px_var(--accent-cyan)]'
          : 'glass text-muted-foreground hover:text-foreground',
      )}
    >
      <Languages className="size-3" />
      {label}
      <span className="opacity-60">· {count}</span>
    </button>
  );
}
