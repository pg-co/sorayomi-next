import { ArrowDown, ArrowRight, ArrowUpDown, Book, BookCopy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReaderSettings } from './reader-settings-store';

export function ReaderSettingsPanel({
  settings,
  onChange,
  onClose,
}: {
  settings: ReaderSettings;
  onChange: (patch: Partial<ReaderSettings>) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-3 top-14 z-50 w-72 rounded-2xl border border-glass-border bg-background/85 p-3 text-foreground shadow-2xl shadow-[0_0_40px_-12px_var(--accent-cyan)] backdrop-blur-xl">
        <Section label="Reading mode">
          <Segment
            value={settings.mode}
            onChange={(mode) => onChange({ mode })}
            options={[
              { value: 'single', label: 'Single', icon: <Book className="size-4" /> },
              { value: 'double', label: 'Double', icon: <BookCopy className="size-4" /> },
              { value: 'vertical', label: 'Webtoon', icon: <ArrowDown className="size-4" /> },
              { value: 'horizontal', label: 'Horizontal', icon: <ArrowRight className="size-4" /> },
            ]}
          />
        </Section>

        <Section label="Direction">
          <Segment
            value={settings.rtl ? 'rtl' : 'ltr'}
            onChange={(v) => onChange({ rtl: v === 'rtl' })}
            options={[
              { value: 'ltr', label: 'Left → right' },
              { value: 'rtl', label: 'Right → left' },
            ]}
          />
        </Section>

        <Section label="Fit">
          <Segment
            value={settings.fit}
            onChange={(fit) => onChange({ fit })}
            options={[
              { value: 'height', label: 'Height' },
              { value: 'width', label: 'Width' },
              { value: 'original', label: 'Original' },
            ]}
          />
        </Section>

        <Section label="Background">
          <Segment
            value={settings.bg}
            onChange={(bg) => onChange({ bg })}
            options={[
              { value: 'black', label: 'Black' },
              { value: 'gray', label: 'Gray' },
              { value: 'white', label: 'White' },
            ]}
          />
        </Section>

        <Section label="Page padding">
          <input
            type="range"
            min={0}
            max={48}
            step={4}
            value={settings.pagePadding}
            onChange={(e) => onChange({ pagePadding: Number(e.target.value) })}
            className="w-full accent-[var(--primary)]"
          />
        </Section>

        <Toggle
          label="Pixelated rendering"
          checked={settings.pixelated}
          onChange={(pixelated) => onChange({ pixelated })}
        />
      </div>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="mb-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Segment<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string; icon?: React.ReactNode }>;
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg bg-secondary/60 p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs transition',
              active
                ? 'bg-primary font-medium text-primary-foreground shadow-[0_0_14px_-4px_var(--accent-cyan)]'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm transition hover:bg-accent/40"
    >
      <span className="text-foreground/90">{label}</span>
      <span
        className={cn(
          'grid size-5 place-items-center rounded-md border transition',
          checked
            ? 'border-transparent bg-primary text-primary-foreground shadow-[0_0_12px_-2px_var(--accent-cyan)]'
            : 'border-border',
        )}
      >
        {checked ? <Check className="size-3.5" /> : null}
      </span>
    </button>
  );
}

// Re-export for the controls file's "ArrowUpDown" use if needed.
export { ArrowUpDown };
