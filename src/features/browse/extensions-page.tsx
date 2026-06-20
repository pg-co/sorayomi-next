import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery } from 'urql';
import { ArrowLeft, Loader2, RefreshCcw, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { AuthImage } from '@/components/auth-image';
import {
  EXTENSIONS_DOC,
  FETCH_EXTENSIONS_DOC,
  UPDATE_EXTENSION_DOC,
} from './queries';
import { resolveUrl } from '@/lib/server-config';
import { rest } from '@/lib/rest/client';
import { cn } from '@/lib/utils';

type Tab = 'updates' | 'installed' | 'available';

export function ExtensionsPage() {
  const [{ data, fetching, error }, reload] = useQuery({ query: EXTENSIONS_DOC });
  const [, refetch] = useMutation(FETCH_EXTENSIONS_DOC);
  const [refreshing, setRefreshing] = useState(false);

  const exts = useMemo(() => data?.extensions.nodes ?? [], [data]);
  const buckets = useMemo(() => {
    const updates = exts.filter((e) => e.isInstalled && e.hasUpdate);
    const installed = exts.filter((e) => e.isInstalled && !e.hasUpdate);
    const available = exts.filter((e) => !e.isInstalled);
    return { updates, installed, available };
  }, [exts]);

  const [tab, setTab] = useState<Tab>('installed');
  const [filter, setFilter] = useState('');

  const list = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return buckets[tab];
    return buckets[tab].filter((e) =>
      `${e.name} ${e.pkgName} ${e.lang}`.toLowerCase().includes(q),
    );
  }, [buckets, tab, filter]);

  async function refresh() {
    setRefreshing(true);
    try {
      const r = await refetch({});
      if (r.error) toast.error(r.error.message);
      else toast.success('Extension list refreshed');
      reload({ requestPolicy: 'network-only' });
    } finally {
      setRefreshing(false);
    }
  }

  async function onPickApk(file: File) {
    try {
      const form = new FormData();
      form.append('extensionFile', file);
      // Suwayomi accepts the multipart upload via the /api/v1/extension/install REST endpoint
      // (functionally equivalent to the GraphQL Upload route).
      await rest.post('api/v1/extension/install', { body: form });
      toast.success('Extension installed');
      reload({ requestPolicy: 'network-only' });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Install failed');
    }
  }

  return (
    <div className="px-4 py-6 md:px-8">
      <Link
        to="/browse"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Browse
      </Link>

      <header className="reveal mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-semibold uppercase tracking-tight">Extensions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Install and update sources from your configured extension repos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="glass inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            <RefreshCcw className={cn('size-4', refreshing && 'animate-spin')} />
            Refresh
          </button>
          <label className="glow-cyan inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110">
            <Upload className="size-4" />
            Install APK
            <input
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onPickApk(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>
      </header>

      <div className="glass mb-4 flex gap-1 rounded-xl p-1">
        <TabButton active={tab === 'updates'} onClick={() => setTab('updates')} label="Updates" count={buckets.updates.length} />
        <TabButton active={tab === 'installed'} onClick={() => setTab('installed')} label="Installed" count={buckets.installed.length} />
        <TabButton active={tab === 'available'} onClick={() => setTab('available')} label="Available" count={buckets.available.length} />
      </div>

      <label className="relative mb-4 flex items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search extensions by name…"
          className="glass h-10 w-full rounded-xl pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:shadow-[0_0_18px_-6px_var(--accent-cyan)]"
        />
      </label>

      {error ? (
        <p className="glass rounded-xl border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      {fetching && exts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : list.length === 0 ? (
        <p className="glass rounded-xl border-dashed border-glass-border px-4 py-12 text-center text-sm text-muted-foreground">
          {filter.trim()
            ? `No extensions match “${filter.trim()}”.`
            : tab === 'updates'
              ? 'All extensions are up to date.'
              : tab === 'installed'
                ? 'No extensions installed.'
                : 'No extensions available — try Refresh.'}
        </p>
      ) : (
        <ul className="glass divide-y divide-glass-border overflow-hidden rounded-2xl">
          {list.map((e) => (
            <ExtensionRow key={e.pkgName} ext={e} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TabButton({
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
        'flex-1 rounded-lg px-3 py-1.5 font-display text-sm font-medium uppercase tracking-wide transition',
        active
          ? 'bg-primary text-primary-foreground shadow-[0_0_16px_-5px_var(--accent-cyan)]'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label} <span className="font-mono opacity-60">· {count}</span>
    </button>
  );
}

type Ext = {
  pkgName: string;
  name: string;
  lang: string;
  iconUrl: string;
  versionName: string;
  isInstalled: boolean;
  isObsolete: boolean;
  isNsfw: boolean;
  hasUpdate: boolean;
  repo?: string | null;
};

function ExtensionRow({ ext }: { ext: Ext }) {
  const [, run] = useMutation(UPDATE_EXTENSION_DOC);
  const [busy, setBusy] = useState(false);

  async function fire(action: 'install' | 'uninstall' | 'update') {
    setBusy(true);
    try {
      const r = await run({
        id: ext.pkgName,
        install: action === 'install',
        uninstall: action === 'uninstall',
        update: action === 'update',
      });
      if (r.error) toast.error(r.error.message);
      else
        toast.success(
          action === 'install' ? 'Installed' : action === 'uninstall' ? 'Uninstalled' : 'Updated',
        );
    } finally {
      setBusy(false);
    }
  }

  let action: { label: string; perform: () => void; variant: 'primary' | 'ghost' | 'destructive' };
  if (ext.hasUpdate) action = { label: 'Update', perform: () => fire('update'), variant: 'primary' };
  else if (ext.isInstalled)
    action = { label: 'Uninstall', perform: () => fire('uninstall'), variant: 'destructive' };
  else action = { label: 'Install', perform: () => fire('install'), variant: 'primary' };

  return (
    <li className="flex items-center gap-3 px-3 py-3">
      <AuthImage
        src={resolveUrl(ext.iconUrl)}
        alt=""
        className="size-10 shrink-0 rounded-lg bg-background/60 object-contain ring-1 ring-glass-border"
        onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {ext.name}
          {ext.isObsolete ? (
            <span className="ml-2 rounded-md bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
              Obsolete
            </span>
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[ext.lang, `v${ext.versionName}`, ext.isNsfw ? 'NSFW' : null, ext.repo ?? null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <button
        type="button"
        onClick={action.perform}
        disabled={busy}
        className={cn(
          'inline-flex min-w-24 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition',
          action.variant === 'primary' &&
            'glow-cyan bg-primary text-primary-foreground hover:brightness-110',
          action.variant === 'destructive' &&
            'border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20',
          action.variant === 'ghost' && 'glass text-muted-foreground hover:text-foreground',
          busy && 'opacity-60',
        )}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : action.label}
      </button>
    </li>
  );
}
