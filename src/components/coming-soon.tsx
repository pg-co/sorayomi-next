import { Construction } from 'lucide-react';

export function ComingSoon({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="reveal flex h-full flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <div className="glow-cyan grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
        <Construction className="size-6" />
      </div>
      <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">{title}</h1>
      {hint ? <p className="max-w-md text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
