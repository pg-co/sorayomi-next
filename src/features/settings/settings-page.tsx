import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'urql';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { readServerConfig, writeServerConfig } from '@/lib/server-config';
import { useShowNsfw } from '@/lib/client-prefs';
import { SETTINGS_DOC, SET_EXTENSION_REPOS_DOC, SET_FLARESOLVERR_DOC } from './queries';
import { cn } from '@/lib/utils';

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8">
      <h2 className="font-display text-3xl font-semibold tracking-tight">Settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">Configure your Suwayomi server and app preferences.</p>

      <ServerSection />
      <ContentSection />
      <FlareSolverrSection />
      <ExtensionsSection />
    </div>
  );
}

function ServerSection() {
  const initial = readServerConfig();
  const [url, setUrl] = useState(initial.url);
  const [user, setUser] = useState(initial.basicAuth?.username ?? '');
  const [pass, setPass] = useState(initial.basicAuth?.password ?? '');

  function save() {
    writeServerConfig({
      url: url.trim().replace(/\/+$/, ''),
      basicAuth: user ? { username: user, password: pass } : undefined,
    });
    toast.success('Server settings saved.');
  }

  return (
    <section className="mt-8 rounded-2xl border bg-elevated p-5">
      <h3 className="font-display text-lg font-semibold">Server</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Leave URL empty to use same-origin (e.g. when sorayomi is served by Suwayomi itself, or via the Vite dev proxy).
      </p>
      <div className="mt-4 space-y-3">
        <Field label="Server URL" placeholder="http://localhost:4567" value={url} onChange={setUrl} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Username (basic auth, optional)" value={user} onChange={setUser} />
          <Field label="Password" type="password" value={pass} onChange={setPass} />
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95"
        >
          Save
        </button>
      </div>
    </section>
  );
}

function ContentSection() {
  const [showNsfw, setShowNsfw] = useShowNsfw();
  return (
    <section className="mt-6 rounded-2xl border bg-elevated p-5">
      <h3 className="font-display text-lg font-semibold">Content</h3>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Show NSFW sources</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            When off, sources flagged as NSFW are hidden from the browse list.
          </p>
        </div>
        <Toggle checked={showNsfw} onChange={setShowNsfw} ariaLabel="Show NSFW sources" />
      </div>
    </section>
  );
}

function FlareSolverrSection() {
  const [{ data, fetching, error }, refetch] = useQuery({
    query: SETTINGS_DOC,
    requestPolicy: 'cache-and-network',
  });
  const [, run] = useMutation(SET_FLARESOLVERR_DOC);
  const [enabled, setEnabled] = useState(false);
  const [sessionName, setSessionName] = useState('suwayomi');
  const [sessionTtl, setSessionTtl] = useState('15');
  const [timeout, setTimeoutValue] = useState('60');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data?.settings) return;
    setEnabled(data.settings.flareSolverrEnabled);
    setSessionName(data.settings.flareSolverrSessionName);
    setSessionTtl(String(data.settings.flareSolverrSessionTtl));
    setTimeoutValue(String(data.settings.flareSolverrTimeout));
    setUrl(data.settings.flareSolverrUrl);
  }, [data]);

  async function save() {
    const nextUrl = url.trim();
    const nextSessionName = sessionName.trim();
    const nextSessionTtl = Number.parseInt(sessionTtl, 10);
    const nextTimeout = Number.parseInt(timeout, 10);

    if (!Number.isFinite(nextSessionTtl) || nextSessionTtl < 0) {
      toast.error('FlareSolverr session TTL must be 0 or greater.');
      return;
    }

    if (!Number.isFinite(nextTimeout) || nextTimeout < 0) {
      toast.error('FlareSolverr timeout must be 0 or greater.');
      return;
    }

    if (enabled && nextUrl && !/^https?:\/\//i.test(nextUrl)) {
      toast.error('FlareSolverr URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    try {
      const res = await run({
        flareSolverrEnabled: enabled,
        flareSolverrSessionName: nextSessionName,
        flareSolverrSessionTtl: nextSessionTtl,
        flareSolverrTimeout: nextTimeout,
        flareSolverrUrl: nextUrl,
      });
      if (res.error) toast.error(res.error.message);
      else {
        toast.success('FlareSolverr settings saved');
        refetch({ requestPolicy: 'network-only' });
      }
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    !!data &&
    (enabled !== data.settings.flareSolverrEnabled ||
      sessionName.trim() !== data.settings.flareSolverrSessionName ||
      url.trim() !== data.settings.flareSolverrUrl ||
      sessionTtl !== String(data.settings.flareSolverrSessionTtl) ||
      timeout !== String(data.settings.flareSolverrTimeout));

  return (
    <section className="mt-6 rounded-2xl border bg-elevated p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold">FlareSolverr</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure the external FlareSolverr service used by some protected sources, following the VUI server settings surface.
          </p>
        </div>
        <Toggle checked={enabled} onChange={setEnabled} ariaLabel="Enable FlareSolverr" />
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        <Field
          label="FlareSolverr URL"
          placeholder="http://localhost:8191"
          value={url}
          onChange={setUrl}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            label="Session name"
            placeholder="suwayomi"
            value={sessionName}
            onChange={setSessionName}
          />
          <Field
            label="Session TTL"
            type="number"
            value={sessionTtl}
            onChange={setSessionTtl}
          />
        </div>
        <Field
          label="Timeout"
          type="number"
          value={timeout}
          onChange={setTimeoutValue}
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          TTL and timeout are stored as integer values by the server.
        </p>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving || fetching}
          className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </section>
  );
}

function ExtensionsSection() {
  const [{ data, fetching, error }, refetch] = useQuery({
    query: SETTINGS_DOC,
    requestPolicy: 'cache-and-network',
  });
  const [, run] = useMutation(SET_EXTENSION_REPOS_DOC);
  const [repos, setRepos] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings.extensionRepos) {
      setRepos([...data.settings.extensionRepos]);
    }
  }, [data]);

  function addRepo() {
    const url = draft.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error('Repo URL must start with http:// or https://');
      return;
    }
    if (repos.includes(url)) {
      toast.error('Repo already added');
      return;
    }
    setRepos((r) => [...r, url]);
    setDraft('');
  }

  function removeRepo(url: string) {
    setRepos((r) => r.filter((x) => x !== url));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await run({ extensionRepos: repos });
      if (res.error) toast.error(res.error.message);
      else {
        toast.success('Extension repos saved');
        refetch({ requestPolicy: 'network-only' });
      }
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    !!data &&
    (repos.length !== data.settings.extensionRepos.length ||
      repos.some((r, i) => r !== data.settings.extensionRepos[i]));

  return (
    <section className="mt-6 rounded-2xl border bg-elevated p-5">
      <h3 className="font-display text-lg font-semibold">Extension repos</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Third-party repositories Suwayomi pulls extensions from. Each entry is the URL of an{' '}
        <code className="rounded bg-background px-1 py-0.5 text-xs">index.min.json</code>.
      </p>

      {error ? (
        <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {fetching && !data ? (
          <li className="h-10 animate-pulse rounded-xl bg-background" />
        ) : repos.length === 0 ? (
          <li className="rounded-xl border border-dashed px-3 py-3 text-sm text-muted-foreground">
            No repos configured.
          </li>
        ) : (
          repos.map((r) => (
            <li
              key={r}
              className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm"
            >
              <span className="flex-1 truncate font-mono text-xs">{r}</span>
              <button
                type="button"
                onClick={() => removeRepo(r)}
                aria-label="Remove repo"
                className="rounded-lg p-1 text-muted-foreground transition hover:bg-accent hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))
        )}
      </ul>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
          placeholder="https://example.com/index.min.json"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addRepo();
            }
          }}
        />
        <button
          type="button"
          onClick={addRepo}
          className="inline-flex items-center gap-1.5 rounded-xl border bg-elevated px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <Plus className="size-4" />
          Add
        </button>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-95 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        className="block w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition',
        checked ? 'bg-primary' : 'bg-background',
      )}
    >
      <span
        className={cn(
          'inline-block size-5 rounded-full bg-foreground/90 shadow-sm transition',
          checked ? 'translate-x-[22px] bg-primary-foreground' : 'translate-x-0.5 bg-muted-foreground',
        )}
      />
    </button>
  );
}
